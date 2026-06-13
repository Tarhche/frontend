import {NotFound} from "@/components/not-found";

// Root not-found boundary. Renders the styled 404 for any notFound() that
// escapes the route-group boundaries (otherwise Next falls back to its bare
// built-in "This page could not be found" page).
export default function RootNotFound() {
  return <NotFound />;
}
