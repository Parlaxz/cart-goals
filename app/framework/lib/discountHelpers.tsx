import { useEffect, useMemo } from "react";
import { useForm, useField } from "@shopify/react-form";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { CurrencyCode } from "@shopify/react-i18n";
import {
    json,
    useActionData,
    useLoaderData,
    useNavigation,
    useSubmit,
} from "@remix-run/react";
import {
    DiscountMethod,
    RequirementType,
} from "@shopify/discount-app-components";
import { Banner, Layout } from "@shopify/polaris";

interface DiscountConfiguration {
    quantity: string;
    percentage: string;
}

interface DiscountValues {
    title: string;
    method: string;
    code: string;
    combinesWith: any;
    usageLimit: string | null;
    appliesOncePerCustomer: boolean;
    startsAt: string;
    endsAt: string;
    configuration: DiscountConfiguration;
}

/**
 * Creates a discount in the Shopify admin.
 * @param discount - The discount to create.
 * @param id - The ID of the discount.
 * @param functionId - The ID of the function.
 * @param admin - The admin API client.
 * @param namespace - The namespace of the metafield.
 * @returns The response from the Shopify admin.
 */
export const createDiscount = async ({
    discount,
    id,
    functionId,
    admin,
    namespace,
}: {
    admin: any;
    id: string | undefined;
    functionId: string | undefined;
    discount: DiscountValues;
    namespace: string;
}) => {
    const {
        title,
        method,
        code,
        combinesWith,
        usageLimit,
        appliesOncePerCustomer,
        startsAt,
        endsAt,
        configuration,
    }: DiscountValues = discount;

    const baseDiscount = {
        functionId,
        title,
        combinesWith,
        startsAt: new Date(startsAt),
        endsAt: endsAt && new Date(endsAt),
    };

    if (method === DiscountMethod.Code) {
        const baseCodeDiscount = {
            ...baseDiscount,
            title: code,
            code,
            usageLimit,
            appliesOncePerCustomer,
        };

        const response = await admin.graphql(
            `#graphql
          mutation CreateCodeDiscount($discount: DiscountCodeAppInput!) {
            discountCreate: discountCodeAppCreate(codeAppDiscount: $discount) {
              userErrors {
                code
                message
                field
              }
            }
          }`,
            {
                variables: {
                    discount: {
                        ...baseCodeDiscount,
                        metafields: [
                            {
                                namespace: namespace,
                                key: "function-configuration",
                                type: "json",
                                value: JSON.stringify({ ...configuration }),
                            },
                        ],
                    },
                },
            },
        );

        const responseJson = await response.json();
        const errors = responseJson?.data?.discountCreate?.userErrors ?? [];
        return json({ errors });
    } else {
        const response = await admin.graphql(
            `#graphql
                mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
                    discountCreate: discountAutomaticAppCreate(automaticAppDiscount: $discount) {
                    userErrors {
                        code
                        message
                        field
                    }
                    }
                }
                `,
            {
                variables: {
                    discount: {
                        ...baseDiscount,
                        metafields: [
                            {
                                namespace: namespace,
                                key: "function-configuration",
                                type: "json",
                                value: JSON.stringify({ ...configuration }),
                            },
                        ],
                    },
                },
            },
        );

        const responseJson = await response.json();
        const errors = responseJson?.data?.discountCreate?.userErrors ?? [];
        return json({ errors });
    }
};

/**
 * Updates a discount in the Shopify admin.
 * @param discount - The discount to update.
 * @param id - The ID of the discount.
 * @param functionId - The ID of the function.
 * @param admin - The admin API client.
 * @param namespace - The namespace of the metafield.
 * @param metafieldId - The ID of the metafield.
 * @returns The response from the Shopify admin.
 */
export const updateDiscount = async ({
    discount,
    id,
    functionId,
    admin,
    namespace,
    metafieldId,
}: {
    admin: any;
    functionId: string | undefined;
    id: string | undefined;
    discount: DiscountValues;
    namespace: string;
    metafieldId: string | undefined;
}) => {
    console.log("discount", discount);
    console.log("id", id);
    console.log("admin", admin);
    console.log("namespace", namespace);
    console.log("metafieldId", metafieldId);
    const {
        title,
        method,
        code,
        combinesWith,
        usageLimit,
        appliesOncePerCustomer,
        startsAt,
        endsAt,
        configuration,
    }: DiscountValues = discount;

    const baseDiscount = {
        functionId,
        title,
        combinesWith,
        startsAt: new Date(startsAt),
        endsAt: endsAt && new Date(endsAt),
    };

    if (method === DiscountMethod.Code) {
        const baseCodeDiscount = {
            ...baseDiscount,
            title: code,
            code,
            usageLimit,
            appliesOncePerCustomer,
            metafields: [
                {
                    id: metafieldId,
                    type: "json",
                    value: JSON.stringify({ ...configuration }),
                },
            ],
        };
        console.log("testttttt", baseCodeDiscount);

        const response = await admin.graphql(
            `#graphql
            mutation discountCodeAppUpdate($codeAppDiscount: DiscountCodeAppInput!, $id: ID!) {
              discountCodeAppUpdate(codeAppDiscount: $codeAppDiscount, id: $id) {
                codeAppDiscount {
                  discountId
                  title
                  endsAt
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
            {
                variables: {
                    id: id,
                    codeAppDiscount: {
                        ...baseCodeDiscount,
                    },
                },
            },
        );
        console.log("inputVariables", {
            variables: {
                id: id,
                codeAppDiscount: {
                    ...baseCodeDiscount,
                },
                metafields: [
                    {
                        id: metafieldId,
                        type: "json",
                        value: JSON.stringify({ ...configuration }),
                    },
                ],
            },
        });
        const responseJson = await response.json();
        console.log(
            "responseJson",
            responseJson.data.discountCodeAppUpdate.codeAppDiscount,
        );

        const errors = responseJson?.data?.discountCreate?.userErrors ?? [];
        console.log("errors", errors);
        return json({ errors });
    } else {
        const response = await admin.graphql(
            `#graphql
                mutation UpdateAutomaticDiscount($discount: DiscountAutomaticAppInput! $id: ID!) {
                    discountCreate: discountAutomaticAppUpdate(automaticAppDiscount: $discount, id: $id ) {
                    userErrors {
                        code
                        message
                        field
                    }
                    }
                }
                `,
            {
                variables: {
                    discount: {
                        ...baseDiscount,
                        metafields: [
                            {
                                id: metafieldId,
                                type: "json",
                                value: JSON.stringify({ ...configuration }),
                            },
                        ],
                    },
                    id: id,
                },
            },
        );

        const responseJson = await response.json();
        const errors = responseJson?.data?.discountCreate?.userErrors ?? [];
        return json({ errors });
    }
};

/**
 * Builds a GraphQL query for retrieving discount information.
 * @param namespace - The namespace of the metafield.
 * @param key - The key of the metafield.
 * @param id - The ID of the discount node.
 * @returns The GraphQL query string.
 */
export const buildDiscountQuery = (
    namespace: string,
    key: string,
    id: string | undefined,
) => {
    const codeString = `title
    startsAt
    endsAt
    usageLimit
    codes(first: 3){
        edges{
            node{
                    code
                }
        }
    }
    combinesWith {
        orderDiscounts
        productDiscounts
        shippingDiscounts
    }`;
    const autoString = `
    title
    startsAt
    endsAt
    combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
        }
    `;
    const autoTypes = [
        "DiscountAutomaticApp",
        "DiscountAutomaticBasic",
        "DiscountAutomaticBxgy",
        "DiscountAutomaticFreeShipping",
    ];
    const codeTypes = [
        "DiscountCodeApp",
        "DiscountCodeBasic",
        "DiscountCodeBxgy",
        "DiscountCodeFreeShipping",
    ];
    const codeStrings = codeTypes
        .map((type) => {
            return `... on ${type} {
            ${codeString}
        }`;
        })
        .join("\n");
    const autoStrings = autoTypes
        .map((type) => {
            return `... on ${type} {
            ${autoString}
        }`;
        })
        .join("\n");

    return (
        "#graphql" +
        `
        query {
            discountNode(id: "gid://shopify/DiscountNode/${id}") {
            id
            metafield(namespace: "${namespace}", key: "${key}") {
                value
                id
            }
            discount {
                ${codeStrings}
                ${autoStrings}
            }
            }
        }`
    );
};

/**
 * A dictionary that maps discount method names to their corresponding discount methods.
 */
export const methodDict = {
    DiscountCodeApp: DiscountMethod.Code,
    DiscountCodeBasic: DiscountMethod.Code,
    DiscountCodeBxgy: DiscountMethod.Code,
    DiscountCodeFreeShipping: DiscountMethod.Code,
    DiscountCodeNode: DiscountMethod.Code,
    DiscountAutomaticApp: DiscountMethod.Automatic,
    DiscountAutomaticBasic: DiscountMethod.Automatic,
    DiscountAutomaticBxgy: DiscountMethod.Automatic,
    DiscountAutomaticFreeShipping: DiscountMethod.Automatic,
    DiscountAutomaticNode: DiscountMethod.Automatic,
};

/**
 * Custom hook for managing discount form logic
 * @param config - An array of configuration objects for each field in the form.
 * @returns An object containing various properties and functions related to the discount form.
 */
export const useDiscountForm = (
    config: {
        title: string;
        default: any;
        type: "string" | "float" | "int";
    }[],
) => {
    const loaderData = useLoaderData();
    //@ts-ignore
    const discountData = loaderData?.discount?.discount;

    const loaderDiscountMethod = discountData?.discountMethod;
    const isNew = discountData == null;
    const submitForm = useSubmit();
    const actionData = useActionData() as { errors?: any[] };
    const navigation = useNavigation();
    const app = useAppBridge();
    const todaysDate = useMemo(() => new Date(), []);

    const isLoading = navigation.state === "submitting";
    const currencyCode = CurrencyCode.Usd;
    const submitErrors = actionData?.errors || [];
    const redirect = Redirect.create(app);
    useEffect(() => {
        if (actionData?.errors?.length === 0) {
            redirect.dispatch(Redirect.Action.ADMIN_SECTION, {
                name: Redirect.ResourceType.Discount,
            });
        }
    }, [actionData, redirect]);
    const errorBanner =
        submitErrors.length > 0 ? (
            <Layout.Section>
                <Banner tone="critical">
                    <p>There were some issues with your form submission:</p>
                    <ul>
                        {submitErrors.map(
                            (
                                {
                                    message,
                                    field,
                                }: { message: string; field: string[] },
                                index: number,
                            ) => {
                                return (
                                    <li key={`${message}${index}`}>
                                        {field.join(".")} {message}
                                    </li>
                                );
                            },
                        )}
                    </ul>
                </Banner>
            </Layout.Section>
        ) : null;

    const dynamicFields: any = {};
    config.forEach((fieldConfig: { title: string }) => {
        //@ts-ignore
        dynamicFields[fieldConfig.title] = DynamicField(
            fieldConfig,
            discountData,
        );
    });
    const { fields, submit } = useForm({
        fields: {
            discountId: useField(discountData?.discountId || ""),
            discountTitle: useField(discountData?.discountTitle || ""),
            discountMethod: useField(
                discountData?.discountMethod || DiscountMethod.Code,
            ),
            discountCode: useField(
                loaderDiscountMethod === DiscountMethod.Code
                    ? discountData?.discountCode || ""
                    : "",
            ),
            combinesWith: useField(
                discountData?.combinesWith || {
                    orderDiscounts: false,
                    productDiscounts: false,
                    shippingDiscounts: false,
                },
            ),
            requirementType: useField(RequirementType.None),
            requirementSubtotal: useField("0"),
            requirementQuantity: useField("0"),
            usageLimit: useField(discountData?.usageLimit || null),
            appliesOncePerCustomer: useField(false),
            startDate: useField(
                discountData?.startDate || todaysDate.toISOString(),
            ),
            endDate: useField(discountData?.endDate || null),
            configuration: dynamicFields,
            metafieldId: useField(discountData?.metafieldId || ""),
        },
        onSubmit: async (form) => {
            const discountConfig: any = {
                quantity: "1",
                percentage: "0",
            };
            config.forEach((fieldConfig) => {
                //@ts-ignore
                discountConfig[fieldConfig.title] =
                    fieldConfig.type === "int"
                        ? parseInt(form.configuration[fieldConfig.title])
                        : fieldConfig.type === "float"
                          ? parseFloat(form.configuration[fieldConfig.title])
                          : form.configuration[fieldConfig.title];
            });

            const discount = {
                title: form.discountTitle,
                method: form.discountMethod,
                code: form.discountCode,
                combinesWith: form.combinesWith,
                usageLimit:
                    form.usageLimit == null ? null : parseInt(form.usageLimit),
                appliesOncePerCustomer: form.appliesOncePerCustomer,
                startsAt: form.startDate,
                endsAt: form.endDate,
                configuration: {
                    quantity: parseInt(form.configuration.quantity),
                    percentage: parseFloat(form.configuration.percentage),
                },
            };

            submitForm(
                {
                    discount: JSON.stringify(discount),
                    id: form.discountId,
                    metafieldId: form.metafieldId,
                },
                { method: "post" },
            );

            return { status: "success" };
        },
    });

    return {
        isNew,
        actionData,
        redirect,
        isLoading,
        currencyCode,
        errorBanner,
        fields,
        submit,
    };
};

/**
 * A helper function that creates a dynamic field for a discount.
 * @param fieldConfig - The configuration for the field.
 * @param discountData - The data for the discount.
 * @returns The field created using the useField hook.
 */
const DynamicField = (fieldConfig: any, discountData: any) => {
    return useField(
        discountData?.configuration?.[fieldConfig.title] ||
            fieldConfig.default.toString(),
    );
};
