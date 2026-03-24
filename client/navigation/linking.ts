import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./RootStackNavigator";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["ocrecipes://", "https://ocrecipes.app"],
  config: {
    screens: {
      Main: {
        screens: {
          MealPlanTab: {
            screens: {
              RecipeDetail: {
                path: "recipe/:recipeId",
                parse: { recipeId: (id: string) => parseInt(id, 10) },
              },
            },
          },
          CoachTab: {
            screens: {
              Chat: {
                path: "chat/:conversationId",
                parse: { conversationId: (id: string) => parseInt(id, 10) },
              },
            },
          },
        },
      },
      NutritionDetail: "nutrition/:barcode",
      Scan: "scan",
    },
  },
};
