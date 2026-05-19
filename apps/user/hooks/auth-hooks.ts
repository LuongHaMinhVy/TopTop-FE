import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { authLogin, authRegister, authLogout, authVerifyEmail, oauth2Onboard } from "@/services/auth-api-service";
import { setCredentials, clearCredentials } from "@/store/slices/authSlice";
import type { ApiResponse } from "@/types/api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

export const useLoginMutation = (onSuccessCallback?: () => void) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authLogin(payload),
    onSuccess: (response: ApiResponse<AuthResponse>) => {
      if (response.data) {
        dispatch(setCredentials(response.data));
        if (response.data.user) {
          queryClient.setQueryData(["currentUser"], { data: response.data.user });
        }
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }
      if (onSuccessCallback) {
        onSuccessCallback();
      } else {
        router.push("/");
        router.refresh();
      }
    },
  });
};

export const useRegisterMutation = (onSuccessCallback?: () => void) => {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authRegister(payload),
    onSuccess: () => {
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
  });
};

export const useLogoutMutation = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authLogout,
    onSuccess: () => {
      dispatch(clearCredentials());
      queryClient.setQueryData(["currentUser"], null);
      queryClient.clear();
      router.push("/");
      router.refresh();
    },
  });
};

export const useVerifyEmailMutation = () => {
  return useMutation<ApiResponse<void>, AxiosError<ApiResponse<void>>, string>({
    mutationFn: (token: string) => authVerifyEmail(token),
  });
};

export const useOAuth = () => {
  const openAuthPopup = (provider: 'google' | 'facebook') => {
    document.cookie = `X-App-Id=toptopuser; path=/; max-age=3600; SameSite=Lax`;

    const urls = {
      google: `${process.env.NEXT_PUBLIC_BACK_END_URL}/oauth2/authorization/google?X-App-Id=toptopuser`,
      facebook: `${process.env.NEXT_PUBLIC_BACK_END_URL}/oauth2/authorization/facebook?X-App-Id=toptopuser`
    };

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      urls[provider],
      `auth-${provider}`,
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,toolbar=no,menubar=no,scrollbars=yes`
    );
  };

  return { openAuthPopup };
};

export const useOAuth2OnboardMutation = (onSuccessCallback?: (response: ApiResponse<AuthResponse>) => void) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, accessToken }: { payload: { username: string; dateOfBirth: string }; accessToken?: string }) =>
      oauth2Onboard(payload, accessToken),
    onSuccess: (response: ApiResponse<AuthResponse>) => {
      if (response.data) {
        dispatch(setCredentials(response.data));
        if (response.data.user) {
          queryClient.setQueryData(["currentUser"], { data: response.data.user });
        }
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }
      if (onSuccessCallback) {
        onSuccessCallback(response);
      }
    },
  });
};
