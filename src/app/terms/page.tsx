export const metadata = {
  title: "Terms of Service | Kryptonite",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed text-gray-700">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">
        Terms of Service
      </h1>
      <p className="mb-8 text-gray-500">Last updated: June 20, 2026</p>

      <p className="mb-6">
        These terms govern your use of Kryptonite (&quot;the app&quot;). By
        creating an account or using the app, you agree to these terms.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">
        The service
      </h2>
      <p className="mb-4">
        Kryptonite lets you build and run automated workflows, optionally
        connecting third-party accounts (such as Google) so workflow nodes can
        act on your behalf within the scopes you explicitly authorize.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">
        Your responsibilities
      </h2>
      <p className="mb-4">
        You are responsible for the workflows you create and the accounts you
        connect to them. You must only connect accounts you own or are
        authorized to access, and you must comply with the terms of any
        third-party service (such as Google) you connect through Kryptonite.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">
        Connected accounts
      </h2>
      <p className="mb-4">
        When you connect a third-party account, Kryptonite acts only within the
        scopes you approve during that provider&apos;s consent flow. You can
        disconnect a connected account at any time, which immediately revokes
        Kryptonite&apos;s stored access for that account.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">
        No warranty
      </h2>
      <p className="mb-4">
        The app is provided &quot;as is&quot; without warranties of any kind. We
        are not liable for actions taken by workflows you configure, including
        any automated actions performed on connected third-party accounts.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">Changes</h2>
      <p className="mb-4">
        We may update these terms from time to time. Continued use of the app
        after changes are posted constitutes acceptance of the updated terms.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">Contact</h2>
      <p>
        Questions about these terms can be sent to{" "}
        <a
          className="text-blue-600 underline"
          href="mailto:your-email@example.com"
        >
          your-email@example.com
        </a>
        .
      </p>
    </div>
  );
}
