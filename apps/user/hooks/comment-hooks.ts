import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as commentService from "@/services/comment-api-service";

export const useComments = (videoId: number) => {
  return useQuery({
    queryKey: ["comments", videoId],
    queryFn: () => commentService.getComments(videoId),
    enabled: !!videoId,
  });
};

export const useAddCommentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentService.addComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
    },
  });
};

export const useDeleteCommentMutation = (videoId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentService.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
    },
  });
};
