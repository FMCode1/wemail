import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setCurrentUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code not provided" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        { error: "No refresh token received" },
        { status: 400 }
      );
    }

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client,
    });

    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      return NextResponse.json(
        { error: "Unable to determine Google account email." },
        { status: 400 }
      );
    }

    const email = data.email;
    const name = data.name || null;

    const user = await prisma.user.upsert({
      where: {
        email,
      },
      update: {
        name,
      },
      create: {
        email,
        name,
      },
    });

    await prisma.emailConnection.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: "google",
        },
      },
      update: {
        email,
        refreshToken: tokens.refresh_token,
      },
      create: {
        userId: user.id,
        provider: "google",
        email,
        refreshToken: tokens.refresh_token,
      },
    });

    await setCurrentUserId(user.id);

    return NextResponse.json({
      success: true,
      message: "Google account connected!",
      email,
    });
  } catch (error) {
    console.error("GOOGLE CALLBACK ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}