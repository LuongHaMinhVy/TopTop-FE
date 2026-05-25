import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as commentService from "@/services/comment-api-service";
import type { ApiResponse } from "@/types/api";
import type { CommentResponse } from "@/types/comment";

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
    onSuccess: (response, variables) => {
      if (response.data) {
        queryClient.setQueryData<ApiResponse<CommentResponse[]>>(
          ["comments", variables.videoId],
          (current) => {
            if (!current) return current;
            return {
              ...current,
              data: [response.data!, ...(current.data ?? [])],
              meta: current.meta
                ? {
                    ...current.meta,
                    totalElements: current.meta.totalElements + 1,
                  }
                : current.meta,
            };
          },
        );
      }
      queryClient.invalidateQueries({ queryKey: ["all-videos"] });
    },
  });
};

export const useReplies = (commentId?: number, size = 10) => {
  return useQuery({
    queryKey: ["comment-replies", commentId, size],
    queryFn: () => commentService.getReplies(commentId!, size),
    enabled: !!commentId,
  });
};

export const useAddReplyMutation = (videoId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentService.addReply,
    onSuccess: (response, variables) => {
      if (response.data) {
        queryClient.setQueryData<ApiResponse<CommentResponse[]>>(
          ["comment-replies", variables.commentId, 10],
          (current) => {
            if (!current) {
              return {
                message: response.message,
                data: [response.data!],
                status: response.status,
                timestamp: response.timestamp,
              };
            }
            return {
              ...current,
              data: [...(current.data ?? []), response.data!],
              meta: current.meta
                ? {
                    ...current.meta,
                    totalElements: current.meta.totalElements + 1,
                  }
                : current.meta,
            };
          },
        );

        queryClient.setQueryData<ApiResponse<CommentResponse[]>>(
          ["comments", videoId],
          (current) => {
            if (!current?.data) return current;
            return {
              ...current,
              data: current.data.map((comment) =>
                comment.id === variables.commentId
                  ? {
                      ...comment,
                      replyCount: (comment.replyCount ?? 0) + 1,
                    }
                  : comment,
              ),
            };
          },
        );
      }
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
      queryClient.invalidateQueries({ queryKey: ["comment-replies"] });
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
