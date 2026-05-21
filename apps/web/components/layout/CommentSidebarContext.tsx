"use client";

import { createContext, useContext } from "react";

interface CommentSidebarContextValue {
  activeVideoId: number | null;
  activeVideoAllowComments: boolean;
  isCommentSidebarAvailable: boolean;
  openCommentSidebar: (videoId: number, detailPath?: string, allowComments?: boolean) => void;
  toggleCommentSidebar: (videoId: number, detailPath?: string, allowComments?: boolean) => void;
  closeCommentSidebar: () => void;
}

const noop = () => {};

const CommentSidebarContext = createContext<CommentSidebarContextValue>({
  activeVideoId: null,
  activeVideoAllowComments: true,
  isCommentSidebarAvailable: false,
  openCommentSidebar: noop,
  toggleCommentSidebar: noop,
  closeCommentSidebar: noop,
});

export const CommentSidebarProvider = CommentSidebarContext.Provider;

export function useCommentSidebar() {
  return useContext(CommentSidebarContext);
}
