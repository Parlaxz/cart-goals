// @ts-check
import type {
    RunInput,
    FunctionRunResult,
    Target,
    ProductVariant,
} from "../generated/api";
import { DiscountApplicationStrategy } from "../generated/api";

const EMPTY_DISCOUNT: FunctionRunResult = {
    discountApplicationStrategy: DiscountApplicationStrategy.First,
    discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input: RunInput): FunctionRunResult {
    // The run function essentially returns a discount object where:
    // 1. It filters things that don't qualify for the discount (quantity < 2)
    // 2. Maps the qualified items to a target object (productVariant ids)
    // 3. Returns a discount object with the targets and the discount value
    // Notes: I decide the input in the run.graphql file, so I can make many different types of inputs
    // and then use the input in the run function to determine what to do with the input

    // Define a type for your configuration, and parse it from the metafield
    const configuration: {
        quantity: number;
        percentage: number;
    } = JSON.parse(input?.discountNode?.metafield?.value ?? "{}");

    if (!configuration.quantity || !configuration.percentage) {
        return EMPTY_DISCOUNT;
    }

    const targets: Target[] = input.cart.lines
        // Use the configured quantity instead of a hardcoded value
        .filter(
            (line) =>
                line.quantity >= configuration.quantity &&
                line.merchandise.__typename == "ProductVariant",
        )
        .map((line) => {
            const variant: ProductVariant = line.merchandise as ProductVariant;
            return {
                productVariant: {
                    id: variant.id,
                },
            };
        });

    if (!targets.length) {
        console.error("No cart lines qualify for volume discount.");
        return EMPTY_DISCOUNT;
    }

    return {
        discounts: [
            {
                targets,
                value: {
                    percentage: {
                        // Use the configured percentage instead of a hardcoded value
                        value: configuration.percentage.toString(),
                    },
                },
            },
        ],
        discountApplicationStrategy: DiscountApplicationStrategy.First,
    };
}
