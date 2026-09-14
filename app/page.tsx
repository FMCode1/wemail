export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Wemail
        </h1>

        <p className="mt-4 text-gray-600">
          Send email on your behalf without sharing your password.
        </p>

        <a href="/api/auth/google" className="mt-8 inline-block rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800">
          Connect Email
        </a>

      </div>
    </main>
  );
}
