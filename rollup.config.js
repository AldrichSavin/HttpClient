import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default  [
    {
        input: 'lib/index.ts',
        output: [
            {
                file: './dist/index.js',
                format: 'es',
                sourcemap: true,
            }
        ],
        plugins: [
            typescript({tsconfig: './tsconfig.json'})
        ]
    },
    {
        input: "lib/index.ts",
        output: [{ file: "dist/index.d.ts", format: "es" }],
        plugins: [dts()]
    }
];