import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Badge,
  Icon,
} from "@shopify/polaris";
import { StatusActiveIcon, AlertCircleIcon } from "@shopify/polaris-icons";

interface GscAuthorizationProps {
  initialStatus?: {
    isAuthorized: boolean;
    expiresAt?: string;
  };
}

export default function GscAuthorization({ initialStatus }: GscAuthorizationProps) {
  const fetcher = useFetcher();
  const [authStatus, setAuthStatus] = useState({
    isAuthorized: initialStatus?.isAuthorized || false,
    expiresAt: initialStatus?.expiresAt,
  });

  // Update status when fetcher returns data
  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.token) {
      setAuthStatus({
        isAuthorized: true,
        expiresAt: fetcher.data.expiresAt,
      });
    } else if (fetcher.data?.error) {
      setAuthStatus({
        isAuthorized: false,
        expiresAt: undefined,
      });
    }
  }, [fetcher.data]);

  const handleAuthorize = () => {
    fetcher.submit(
      { action: "authorize" },
      { method: "POST", action: "/app/gsc-auth" }
    );
  };

  const isLoading = fetcher.state === "submitting";

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Google Search Console Authorization
        </Text>
        
        <InlineStack gap="300" align="space-between">
          <InlineStack gap="200" align="center">
            <Icon
              source={authStatus.isAuthorized ? StatusActiveIcon : AlertCircleIcon}
              tone={authStatus.isAuthorized ? "success" : "critical"}
            />
            <Text variant="bodyMd" as="span">
              Status:
            </Text>
            <Badge
              tone={authStatus.isAuthorized ? "success" : "critical"}
              size="medium"
            >
              {authStatus.isAuthorized ? "Authorized" : "Unauthorized"}
            </Badge>
          </InlineStack>

          <Button
            onClick={handleAuthorize}
            loading={isLoading}
            variant="primary"
            disabled={authStatus.isAuthorized}
          >
            {authStatus.isAuthorized ? "Authorized" : "Authorize"}
          </Button>
        </InlineStack>

        {authStatus.isAuthorized && authStatus.expiresAt && (
          <Text variant="bodyMd" tone="subdued" as="p">
            Token expires: {new Date(authStatus.expiresAt).toLocaleString()}
          </Text>
        )}

        {fetcher.data?.error && (
          <Text variant="bodyMd" tone="critical" as="p">
            Error: {fetcher.data.error}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}