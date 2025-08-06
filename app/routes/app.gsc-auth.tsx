import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getToken, getTokenStatus } from "../services/gsc-token.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  
  // Get current token status for initial page load
  const status = await getTokenStatus();
  
  return json({
    isAuthorized: status.isAuthorized,
    expiresAt: status.expiresAt?.toISOString(),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "authorize") {
    try {
      const token = await getToken();
      
      if (token) {
        // Get updated status to return expiry info
        const status = await getTokenStatus();
        
        return json({
          success: true,
          token: true,
          isAuthorized: true,
          expiresAt: status.expiresAt?.toISOString(),
        });
      } else {
        return json({
          success: false,
          error: "Failed to obtain GSC token. Please check your Lambda service.",
        });
      }
    } catch (error) {
      console.error("GSC authorization error:", error);
      return json({
        success: false,
        error: "Authorization failed. Please try again.",
      });
    }
  }
  
  return json({ success: false, error: "Invalid action" });
};