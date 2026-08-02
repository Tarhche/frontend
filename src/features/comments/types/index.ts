export type {Comment} from "./comment";

// The kinds of content a comment can be attached to. Mirrors the backend's
// `comment.ObjectType*` constants.
export type CommentObjectType = "article" | "note";
