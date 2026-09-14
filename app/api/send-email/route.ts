import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGmail } from "@/lib/gmail";
import { getCurrentUserId } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    // Get the currently authenticated Wemail user.
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const to = formData.get("to") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;

    if (!to || !subject || !body) {
      return NextResponse.json(
        {
          error: "To, subject, and message are required.",
        },
        { status: 400 }
      );
    }

    // Get the Google connection belonging to this user.
    const connection = await prisma.emailConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "google",
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        {
          error: "No Google account is connected.",
        },
        { status: 400 }
      );
    }

    const attachmentEntries = formData.getAll("attachments");

    const attachments: {
      filename: string;
      content: Buffer;
      contentType?: string;
    }[] = [];

    for (const entry of attachmentEntries) {
      if (!(entry instanceof File)) {
        continue;
      }

      const arrayBuffer = await entry.arrayBuffer();

      attachments.push({
        filename: entry.name,
        content: Buffer.from(arrayBuffer),
        contentType: entry.type || undefined,
      });
    }

    // IMPORTANT:
    // We use connection.email and connection.refreshToken
    // from the database instead of trusting "from" from the browser.
    await sendGmail(
      connection.refreshToken,
      connection.email,
      to,
      subject,
      body,
      attachments
    );

    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
    });
  } catch (error) {
    console.error("SEND EMAIL ERROR:", error);

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