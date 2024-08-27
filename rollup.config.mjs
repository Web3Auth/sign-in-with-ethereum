import replace from "@rollup/plugin-replace";

export const baseConfig = {
  plugins: [
    replace({
      "process.env.VITE_APP_INFURA_PROJECT_KEY": `"${process.env.VITE_APP_INFURA_PROJECT_KEY}"`,
      preventAssignment: true,
    }),
  ],
};
