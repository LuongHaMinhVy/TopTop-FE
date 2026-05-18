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

export const useReplies = (commentId?: number) => {
  return useQuery({
    queryKey: ["comment-replies", commentId],
    queryFn: () => commentService.getReplies(commentId!),
    enabled: !!commentId,
  });
};

export const useAddReplyMutation = (videoId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentService.addReply,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comment-replies", variables.commentId] });
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
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

export const useLikeCommentMutation = (videoId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, liked }: { commentId: number; liked: boolean }) =>
      liked ? commentService.unlikeComment(commentId) : commentService.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });
};
