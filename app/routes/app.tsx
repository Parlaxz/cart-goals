import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { AppProvider as DiscountAppProvider } from "@shopify/discount-app-components";
import { authenticate } from "../shopify.server";
import { Frame } from "@shopify/polaris";
import { Provider as AppBridgeReactProvider } from "@shopify/app-bridge-react";
import { useState } from "react";
import "@shopify/discount-app-components/build/esm/styles.css";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    const url = new URL(request.url);

    return json({
        apiKey: process.env.SHOPIFY_API_KEY || "",
        host: url.searchParams.get("host"),
    });
};

export default function App() {
    const { apiKey, host } = useLoaderData<typeof loader>();
    const [config] = useState({
        apiKey,
        host,
    });
    return (
        <AppProvider isEmbeddedApp apiKey={apiKey}>
            {/* @ts-ignore */}
            <AppBridgeReactProvider config={config}>
                <DiscountProvider>
                    <Frame
                        logo={{
                            width: 86,
                            contextualSaveBarSource:
                                "https://cdn.shopify.com/s/files/1/2376/3301/files/Shopify_Secondary_Inverted.png",
                        }}
                    >
                        <ui-nav-menu>
                            <Link to="/app" rel="home">
                                Home
                            </Link>
                            <Link to="/app/additional">Additional page</Link>
                        </ui-nav-menu>
                        <Outlet />
                    </Frame>
                </DiscountProvider>
            </AppBridgeReactProvider>
        </AppProvider>
        // <FrameExample />
    );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
    return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
    return boundary.headers(headersArgs);
};

function DiscountProvider({ children }: { children: React.ReactNode }) {
    return (
        // @ts-ignore
        <DiscountAppProvider locale="en-US" ianaTimezone="America/Toronto">
            {children}
        </DiscountAppProvider>
    );
}
