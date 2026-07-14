export const metadata = {
  title: "Privacy Policy | Kryptonite",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed text-gray-700">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mb-8 text-gray-500">Last updated: June 20, 2026</p>

      <p className="mb-6">
        Kryptonite (&quot;we&quot;, &quot;our&quot;, &quot;the app&quot;) is a
        workflow automation tool. This policy explains what data we access, why,
        and how it is handled.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">
        Data we access
      </h2>
      <p className="mb-4">
        When you connect a third-party account (such as Google) to a Kryptonite
        workflow, we request only the minimum scopes needed for the feature you
        enable. For example, the Gmail Search node requests read-only access to
        your Gmail messages (
        <code className="rounded bg-gray-100 px-1">gmail.readonly</code>) and
        your account email address, solely to run the searches you explicitly
        configure in your own workflows.
      </p>
      <p className="mb-4">
        We do not read, store, or process your email content except to execute
        the specific search you request at the moment you run a workflow. Search
        results are used to generate the workflow output you see; we do not use
        this data for advertising, profiling, or any purpose unrelated to
        running your workflow.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">
        How we store data
      </h2>
      <p className="mb-4">
        OAuth access and refresh tokens are encrypted at rest. Tokens are used
        only to make authorized API calls on your behalf when you run a workflow
        that needs them. You can disconnect a connected account at any time from
        the node&apos;s settings, which deletes the stored tokens immediately.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">
        Data sharing
      </h2>
      <p className="mb-4">
        We do not sell or share your data with third parties. Data retrieved
        from connected accounts is processed only to fulfil the workflow you
        configured and is not shared outside of that workflow&apos;s execution.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">
        Your controls
      </h2>
      <p className="mb-4">
        You may disconnect any connected account at any time from within the
        app. You may also revoke Kryptonite&apos;s access directly from your{" "}
        <a
          className="text-blue-600 underline"
          href="https://myaccount.google.com/permissions"
          target="_blank"
          rel="noreferrer"
        >
          Google Account permissions page
        </a>
        .
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-gray-900">Contact</h2>
      <p>
        Questions about this policy can be sent to{" "}
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
