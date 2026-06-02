import { useCallback, useState } from "react";
import { useCountdown } from "@/hooks/useResendCountdown";
import { useSendOtp } from "@/queries/useAuth";
import type { TypeOfVerificationCodeType } from "@/constants/auth";

const RESEND_COOLDOWN_SECONDS = 30;
const OTP_VALIDITY_SECONDS = 5 * 60;

export function useOtpFlow(type: TypeOfVerificationCodeType) {
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const resend = useCountdown(RESEND_COOLDOWN_SECONDS);
  const validity = useCountdown(OTP_VALIDITY_SECONDS);
  const { isPending, mutateAsync: sendCode } = useSendOtp();

  const send = useCallback(
    async (email: string) => {
      await sendCode({ email, type });
      setSentEmail(email);
      resend.start();
      validity.start();
    },
    [sendCode, type, resend, validity],
  );

  const reset = useCallback(() => {
    setSentEmail(null);
    resend.reset();
    validity.reset();
  }, [resend, validity]);

  const hasSent = sentEmail !== null;
  const isExpired = hasSent && validity.seconds === 0;

  return {
    sentEmail,
    hasSent,
    isExpired,
    resend,
    validity,
    send,
    reset,
    isSending: isPending,
  };
}

export type OtpFlow = ReturnType<typeof useOtpFlow>;
