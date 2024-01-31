import type { ActionFunctionArgs } from "@remix-run/node";

import { Form, json } from "@remix-run/react";
import {
    ActiveDatesCard,
    CombinationCard,
    DiscountClass,
    DiscountMethod,
    MethodCard,
    DiscountStatus,
    SummaryCard,
    UsageLimitsCard,
    onBreadcrumbAction,
} from "@shopify/discount-app-components";
import {
    Layout,
    Page,
    PageActions,
    BlockStack,
    Card,
    TextField,
    Text,
} from "@shopify/polaris";

import shopify, { authenticate } from "../shopify.server";
import {
    buildDiscountQuery,
    createDiscount,
    updateDiscount,
    methodDict,
    useDiscountForm,
} from "~/framework/lib/discountHelpers";

//------------------------------------CONFIGURE HERE------------------------------------
const NAMESPACE = "$app:cart-goal";
const KEY = "function-configuration";
const DISCOUNT_NAME = "Cart Goal";
//----------------------------------END CONFIGURE HERE-----------------------------------

export const loader = async ({ params, request }: ActionFunctionArgs) => {
    const { id } = params;
    if (id === "new") {
        return json({ discount: null });
    }

    const discountQuery = buildDiscountQuery(NAMESPACE, KEY, id);
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(discountQuery);
    const data = await response.json();

    //@ts-ignore
    const method = methodDict[data?.data?.discountNode?.id.split("/")[3]];

    const returnData = {
        discount: {
            discountId: data?.data?.discountNode?.id,
            discountMethod: method,
            discountTitle: data?.data?.discountNode?.discount?.title,
            discountCode:
                data?.data?.discountNode?.discount?.codes?.edges[0]?.node?.code,
            combinesWith: data?.data?.discountNode?.discount?.combinesWith,
            startDate: data?.data?.discountNode?.discount?.startsAt,
            endDate: data?.data?.discountNode?.discount?.endsAt,
            usageLimit: data?.data?.discountNode?.discount?.usageLimit,
            configuration: JSON.parse(
                data?.data?.discountNode?.metafield?.value,
            ),
            metafieldId: data?.data?.discountNode?.metafield?.id,
        },
    };
    return json({ discount: returnData });
};

// This is a server-side action that is invoked when the form is submitted.
// It makes an admin GraphQL request to create a discount.
export const action = async ({ params, request }: ActionFunctionArgs) => {
    //1. get basic info
    const { functionId } = params;
    const { admin } = await shopify.authenticate.admin(request);

    //2. get and parse form data
    const formData = await request.formData();

    const parsedDiscount = JSON.parse(String(formData.get("discount") || ""));
    console.log("formData.get(id) ||)", formData.get("id"));

    const parsedId = String(formData.get("id") || "");
    const parsedMetafieldId = String(formData.get("metafieldId") || "");
    //3. create Discount
    if (parsedId) {
        return updateDiscount({
            admin,
            functionId,
            discount: parsedDiscount,
            id: parsedId,
            namespace: NAMESPACE,
            metafieldId: parsedMetafieldId,
        });
    } else {
        return createDiscount({
            admin,
            functionId,
            discount: parsedDiscount,
            id: parsedId,
            namespace: NAMESPACE,
        });
    }
};

// This is the React component for the page.
export default function DiscountNew() {
    //build discount data
    const config: {
        title: string;
        default: any;
        type: "int" | "float" | "string";
    }[] = [
        { title: "quantity", default: 1, type: "int" },
        { title: "percentage", default: 0, type: "float" },
    ];

    const {
        isNew,
        redirect,
        isLoading,
        currencyCode,
        errorBanner,
        fields,
        submit,
    } = useDiscountForm(config);

    const {
        discountTitle,
        discountCode,
        discountMethod,
        combinesWith,
        requirementType,
        requirementSubtotal,
        requirementQuantity,
        usageLimit,
        appliesOncePerCustomer,
        startDate,
        endDate,
        configuration,
    } = fields;

    return (
        // Render a discount form using Polaris components and the discount app components
        <Page
            title={isNew ? "New discount" : "Edit discount"}
            backAction={{
                content: "Discounts",
                onAction: () => onBreadcrumbAction(redirect, true),
            }}
            primaryAction={{
                content: "Save",
                onAction: submit,
                loading: isLoading,
            }}
        >
            <Layout>
                {errorBanner}
                <Layout.Section>
                    <Form method="post">
                        <BlockStack align="space-around" gap={undefined}>
                            {isNew && (
                                <MethodCard
                                    title={DISCOUNT_NAME}
                                    discountTitle={discountTitle}
                                    discountClass={DiscountClass.Product}
                                    discountCode={discountCode}
                                    discountMethod={discountMethod}
                                />
                            )}
                            <Card>
                                <BlockStack gap={undefined}>
                                    <Text variant="headingMd" as="h2">
                                        {DISCOUNT_NAME}
                                    </Text>
                                    <TextField
                                        label="Minimum quantity"
                                        autoComplete="on"
                                        {...configuration.quantity}
                                    />
                                    <TextField
                                        label="Discount percentage"
                                        autoComplete="on"
                                        {...configuration.percentage}
                                        suffix="%"
                                    />
                                </BlockStack>
                            </Card>
                            {discountMethod.value === DiscountMethod.Code && (
                                <UsageLimitsCard
                                    //@ts-ignore

                                    totalUsageLimit={usageLimit}
                                    oncePerCustomer={appliesOncePerCustomer}
                                />
                            )}
                            <CombinationCard
                                combinableDiscountTypes={combinesWith}
                                discountClass={DiscountClass.Product}
                                discountDescriptor={"Discount"}
                            />
                            <ActiveDatesCard
                                startDate={startDate}
                                //@ts-ignore
                                endDate={endDate}
                                timezoneAbbreviation="EST"
                            />
                        </BlockStack>
                    </Form>
                </Layout.Section>
                <Layout.Section>
                    <SummaryCard
                        header={{
                            discountMethod: discountMethod.value,
                            discountDescriptor:
                                discountMethod.value ===
                                DiscountMethod.Automatic
                                    ? discountTitle.value
                                    : discountCode.value,
                            appDiscountType: DISCOUNT_NAME,
                        }}
                        performance={{
                            status: DiscountStatus.Scheduled,
                            usageCount: 0,
                        }}
                        minimumRequirements={{
                            requirementType: requirementType.value,
                            subtotal: requirementSubtotal.value,
                            quantity: requirementQuantity.value,
                            currencyCode: currencyCode,
                        }}
                        usageLimits={{
                            oncePerCustomer: appliesOncePerCustomer.value,
                            totalUsageLimit: usageLimit.value,
                        }}
                        activeDates={{
                            startDate: startDate.value,
                            endDate: endDate.value,
                        }}
                    />
                </Layout.Section>
                <Layout.Section>
                    <PageActions
                        primaryAction={{
                            content: "Save discount",
                            onAction: submit,
                            loading: isLoading,
                        }}
                        secondaryActions={[
                            {
                                content: "Discard",
                                onAction: () =>
                                    onBreadcrumbAction(redirect, true),
                            },
                        ]}
                    />
                </Layout.Section>
            </Layout>
        </Page>
    );
}
