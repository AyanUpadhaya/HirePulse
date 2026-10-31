import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRefreshMutation } from "./api";
import { selectIsAuthInitialized, setInitialized } from "./authSlice";
import { Loader2 } from "lucide-react";

let sessionRestorePromise = null;

export function AuthGate({ children }) {
  const dispatch = useDispatch();
  const isInitialized = useSelector(selectIsAuthInitialized);
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    let isMounted = true;

    if (!isInitialized) {
      if (!sessionRestorePromise) {
        sessionRestorePromise = refresh()
          .unwrap()
          .finally(() => {
            sessionRestorePromise = null;
          });
      }

      sessionRestorePromise
        .catch(() => {
          // No valid session cookie or refresh failed; normal for guest visitors.
        })
        .finally(() => {
          if (isMounted) {
            dispatch(setInitialized(true));
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [dispatch, isInitialized, refresh]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Connecting to HirePulse...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
