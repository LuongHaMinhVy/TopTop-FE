import { useMutation } from "@tanstack/react-query";
import * as mediaService from "@/services/media-api-service";

export const useUploadMediaMutation = () => {
  return useMutation({
    mutationFn: ({ file, context }: { file: File; context: "chat" | "comment" }) =>
      mediaService.uploadMedia(file, context),
  });
};
