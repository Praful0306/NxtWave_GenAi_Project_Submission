import LegalLayout, { Section, Bullets, LEGAL_CONTACT } from '../components/LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro="VaaniTutor is a voice-based language learning app. This page explains exactly what we collect, why, and who else sees it."
    >
      <Section heading="Who we are">
        <p>
          VaaniTutor is an independent educational project operated by the developer reachable at{' '}
          <a href={`mailto:${LEGAL_CONTACT}`} className="font-semibold text-brand hover:underline">
            {LEGAL_CONTACT}
          </a>
          . It is served from <strong className="text-ink">learninglanguagesai.in</strong>.
        </p>
      </Section>

      <Section heading="What we collect">
        <p>Account details, when you register:</p>
        <Bullets
          items={[
            'Your name and email address.',
            'A password, if you sign up with email. It is stored only as a bcrypt hash — we never keep the password itself and cannot recover it.',
            'If you sign in with Google or Zoho, we receive your name and email from that provider. We never receive your password for those accounts.',
          ]}
        />
        <p>Learning data, as you practise:</p>
        <Bullets
          items={[
            'The roadmap generated for each language you study, and which days you have completed.',
            'A text transcript of what you said during a Speak activity, along with the corrected version, the error types identified, and your fluency score.',
            'Your word-order game and quiz results, your streak, and your current level.',
          ]}
        />
        <p>Payment records, if you upgrade to Premium:</p>
        <Bullets
          items={[
            'The Razorpay order ID, payment ID, amount and status.',
            'We never see or store your card number, CVV, UPI PIN or bank credentials. Payment is completed entirely inside Razorpay’s own hosted checkout window.',
          ]}
        />
      </Section>

      <Section heading="Your voice recordings">
        <p>
          This is the part most people want to know about, so to be direct:{' '}
          <strong className="text-ink">we do not store your audio.</strong>
        </p>
        <Bullets
          items={[
            'When you record a phrase, the audio is sent to our speech service, held in memory only for as long as the request takes, and forwarded to a speech-to-text provider to be converted into text.',
            'It is never written to a disk, database or file bucket by us, and it is not retained after the request completes.',
            'The resulting text transcript is saved to your account, because that is what your progress and error history are built from.',
            'The audio does leave our servers in order to be transcribed — see the providers listed below.',
          ]}
        />
      </Section>

      <Section heading="Who else processes your data">
        <p>
          We rely on third-party services to run the app. Each one only receives what it needs to do its job:
        </p>
        <Bullets
          items={[
            'Speech-to-text and text-to-speech — Sarvam AI, and where needed as fallbacks: Zoho Catalyst (Zia), Google Gemini, Groq and OpenAI. These receive your recorded audio, or the text to be spoken aloud.',
            'Language models used to grade your speaking and build your roadmap — OpenRouter, Zoho Catalyst, Google Gemini, Groq, NVIDIA NIM and Cloudflare Workers AI. These receive your transcript and the target phrase, not your audio.',
            'Razorpay — payment processing.',
            'Zoho ZeptoMail — sending your verification and password-reset emails.',
            'MongoDB Atlas — database hosting. Vercel and Render — application hosting.',
          ]}
        />
        <p>
          We do not sell your data, and we do not share it with advertisers. Each provider handles data under its own
          privacy terms.
        </p>
      </Section>

      <Section heading="Cookies and browser storage">
        <p>
          We use no advertising cookies and no third-party analytics. Your browser’s local storage holds two things:
          your sign-in token, so you stay logged in, and your light/dark theme choice. Clearing your browser data
          removes both and signs you out.
        </p>
      </Section>

      <Section heading="How your data is protected">
        <Bullets
          items={[
            'Passwords are hashed with bcrypt and are never stored or logged in readable form.',
            'Every request is authenticated and scoped to your own account, so one learner cannot read another’s roadmaps, transcripts or progress.',
            'Traffic is served over HTTPS.',
            'Payment confirmation is verified by a cryptographic signature check on our server — we never unlock Premium just because a browser claims a payment succeeded.',
          ]}
        />
        <p>
          No system is perfectly secure, and this is an independent educational project rather than a commercial
          service with a dedicated security team. Please keep that in mind when deciding what to say into it.
        </p>
      </Section>

      <Section heading="How long we keep things">
        <p>
          Your account and learning history are kept while your account exists. Email verification codes expire after
          10 minutes and are deleted automatically. Audio is not retained at all. If you ask us to delete your
          account, we remove your profile, roadmaps, practice history and progress records.
        </p>
      </Section>

      <Section heading="Your choices">
        <Bullets
          items={[
            'You can ask for a copy of your data, or ask us to delete your account, by emailing us.',
            'You can correct your name and theme preference at any time in Settings.',
            'You can stop learning a language by archiving it, which keeps your history without adding new sessions.',
            'You can decline microphone access — the Speak activity will not work, but nothing else breaks.',
          ]}
        />
      </Section>

      <Section heading="Children">
        <p>
          VaaniTutor is not intended for children under 13. We do not knowingly collect data from them. If you believe
          a child has created an account, email us and we will remove it.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          If we change how data is handled, we will update this page and the date at the top. Continuing to use the
          app after a change means you accept the updated policy.
        </p>
      </Section>
    </LegalLayout>
  );
}
