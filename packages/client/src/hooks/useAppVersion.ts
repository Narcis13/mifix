import { useEffect, useState } from "react";
import { APP_VERSION, type AppVersionInfo } from "shared";
import { api } from "@/lib/api";

const FALLBACK_APP_VERSION: AppVersionInfo = {
  version: APP_VERSION,
  source: "file",
};

export function useAppVersion(): AppVersionInfo {
  const [appVersion, setAppVersion] = useState<AppVersionInfo>(FALLBACK_APP_VERSION);

  useEffect(() => {
    let isMounted = true;

    /**
     * Load the runtime version so the UI can pick up a database-backed value
     * when one is configured on the server.
     */
    async function loadAppVersion() {
      const response = await api.get<AppVersionInfo>("/health/version");

      if (!isMounted || !response.success || !response.data) {
        return;
      }

      setAppVersion(response.data);
    }

    void loadAppVersion();

    return () => {
      isMounted = false;
    };
  }, []);

  return appVersion;
}
