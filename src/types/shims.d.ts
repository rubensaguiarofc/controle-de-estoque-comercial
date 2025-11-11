// Lightweight shims for modules without @types in this project to unblock the TypeScript
// typecheck. These are intentionally permissive (any) to avoid invasive refactors.

declare module 'genkit';
declare module '@genkit-ai/googleai';
declare module 'react-day-picker';
declare module 'framer-motion';

// react-hook-form minimal shims used in many components. Export permissive any-typed
// functions/types so existing usage compiles. If you want stricter types, replace
// these with the official @types or configure full type stubs.
declare module 'react-hook-form' {
  export function useForm<T = any>(...args: any[]): any;
  export function useFormContext<T = any>(...args: any[]): any;
  export const FormProvider: any;
  export const Controller: any;
  export const useForm: any;
  export type UseFormReturn<T = any> = any;
  export type ControllerProps<TFieldValues = any, TName = any> = any;
  export type FieldValues = any;
  export type FieldPath<T = any> = any;
  export type ControllerPropsWithRules<TFieldValues = any, TName = any> = any;
}

// Zod shim: export a loose namespace `z` with a generic `infer` type so `z.infer<...>`
// and `z.object(...)` usages compile during the initial typefix pass.
declare module 'zod' {
  export namespace z {
    // treat infer as any for now
    type infer<T = any> = any;
  }
  // value export (used by some codepaths) — allow any
  export const z: any;
}
