# TypeScript Strict Mode Rules - Chicago Oracle Project

> **⚠️ MANDATORY**: These rules MUST be followed for all code in this project. All AI assistants and developers must adhere to these guidelines.

## 🚨 CRITICAL RULES TO PREVENT COMPILATION ERRORS

### 1. **Optional Properties vs Undefined - CRITICAL RULE**
```typescript
// ❌ WRONG - Causes exactOptionalPropertyTypes errors
interface BadExample {
  optional?: string;  // This means string | undefined
}

const obj: BadExample = {
  optional: someValue || undefined  // ERROR: string | undefined not assignable to string
};

// ✅ CORRECT - Use explicit undefined
interface GoodExample {
  optional: string | undefined;  // Explicit undefined
}

const obj: GoodExample = {
  optional: someValue ?? undefined  // Use nullish coalescing
};

// 🚨 NEVER USE OPTIONAL PROPERTIES WITH STRICT MODE
// ❌ WRONG
interface LocationData {
  address?: string;  // This will cause errors with exactOptionalPropertyTypes
}

// ✅ CORRECT
interface LocationData {
  address: string | undefined;  // Explicit undefined handling
}
```

### 2. **Environment Variables**
```typescript
// ❌ WRONG - Direct assignment
const config = {
  apiKey: process.env.API_KEY,  // string | undefined
};

// ✅ CORRECT - Validate first
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('Missing API_KEY');
const config = {
  apiKey,  // Now guaranteed to be string
};
```

### 3. **Object Spreading with Conditionals**
```typescript
// ❌ WRONG - Creates undefined properties
const config = {
  required: 'value',
  optional: condition ? value : undefined  // Creates undefined property
};

// ✅ CORRECT - Conditional spreading
const config = {
  required: 'value',
  ...(condition && { optional: value })  // Only adds property if condition is true
};
```

### 4. **Array Access Safety**
```typescript
// ❌ WRONG - Can be undefined
const first = array[0].property;  // array[0] might be undefined

// ✅ CORRECT - Safe access
const first = array[0]?.property;  // Safe optional chaining
```

### 5. **Function Return Types**
```typescript
// ❌ WRONG - Inconsistent optional handling
function getData(): { items: Item[]; lastDoc?: DocumentSnapshot } {
  return {
    items: [],
    lastDoc: someValue || undefined  // ERROR: DocumentSnapshot | undefined not assignable to DocumentSnapshot
  };
}

// ✅ CORRECT - Match the interface exactly
function getData(): { items: Item[]; lastDoc: DocumentSnapshot | undefined } {
  return {
    items: [],
    lastDoc: someValue ?? undefined
  };
}
```

### 6. **Regex Match Safety**
```typescript
// ❌ WRONG - match[1] can be undefined
const result = match[1];  // string | undefined

// ✅ CORRECT - Handle undefined case
const result = match[1]!;  // Non-null assertion (if you're sure it exists)
// OR
const result = match[1] ?? 'default';  // Provide fallback
```

## 🔧 QUICK FIXES FOR COMMON ERRORS

### Error: "Type 'string | undefined' is not assignable to type 'string'"
**Fix:** Use nullish coalescing: `value ?? undefined`

### Error: "Property is missing in type but required"
**Fix:** Add the property: `property: value ?? undefined`

### Error: "No overload matches this call"
**Fix:** Check if you're passing `undefined` where a specific type is expected

### Error: "Object is possibly 'undefined'"
**Fix:** Use optional chaining: `obj?.property`

### 🚨 Error: "Type 'string | undefined' is not assignable to type 'string' with exactOptionalPropertyTypes"
**Fix:** Change interface from `property?: string` to `property: string | undefined`

### 🚨 Error: "Argument of type '{...}' is not assignable to parameter of type 'LocationData'"
**Fix:** Update the interface to use explicit undefined: `address: string | undefined` instead of `address?: string`

## 🛠️ DEVELOPMENT WORKFLOW

1. **Always run type checking:** `npm run type-check`
2. **Fix errors immediately** - don't let them accumulate
3. **Use strict null checks** - be explicit about undefined
4. **Test with strict mode** - ensure your code works with `exactOptionalPropertyTypes: true`

## 📋 CHECKLIST BEFORE COMMITTING

- [ ] No `any` types used
- [ ] All optional properties explicitly handle `undefined`
- [ ] Environment variables are validated
- [ ] Array access uses optional chaining
- [ ] Object spreading uses conditional patterns
- [ ] Function return types match interfaces exactly
- [ ] All regex matches handle undefined cases

## 🚀 AUTOMATED PREVENTION

Add these to your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

And to your `.eslintrc.json`:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error"
  }
}
```

## 📚 PROJECT-SPECIFIC PATTERNS

### **Chicago Oracle Standard Interfaces**

All interfaces in this project follow strict undefined handling:

```typescript
// Image Types (src/types/image.ts)
export interface ImageData {
  id: string;
  src: string;
  alt: string | undefined;                    // ✅ Explicit undefined
  title: string;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy: string | undefined;             // ✅ Explicit undefined
  location: {
    lat: number;
    lng: number;
    address: string | undefined;              // ✅ Explicit undefined
  };
  enhancedAddress: AddressComponents | undefined;
}

// Address Types (src/lib/addressService.ts)
export interface AddressComponents {
  streetNumber: string | undefined;           // ✅ All properties explicit
  streetName: string | undefined;
  neighborhood: string | undefined;
  city: string | undefined;
  state: string | undefined;
  country: string | undefined;
  postalCode: string | undefined;
  formattedAddress: string | undefined;
  distanceFromStreet: number | null | undefined;
}

// Location Types (src/lib/locationService.ts)
export interface LocationData {
  lat: number;
  lng: number;
  address: string | undefined;               // ✅ Explicit undefined
}

// Component Props
interface ImageUploadProps {
  onUploadSuccess: (() => void) | undefined;  // ✅ Function or undefined
  onUploadError: ((error: string) => void) | undefined;
}
```

### **Object Creation Patterns**

Always provide all required properties, even if they're undefined:

```typescript
// ✅ CORRECT - Mock data creation
const mockImage: ImageData = {
  id: "1",
  src: "https://example.com/image.jpg",
  alt: "Sample image",
  title: "Image Title",
  createdAt: new Date(),
  updatedAt: new Date(),
  uploadedBy: undefined,                     // ✅ Explicitly set
  location: {
    lat: 41.8781,
    lng: -87.6298,
    address: "Chicago, IL"
  },
  enhancedAddress: undefined                 // ✅ Explicitly set
};

// ✅ CORRECT - Upload data creation
const uploadData: UploadImageData = {
  file: processedFile,
  title,
  alt: undefined,                            // ✅ Explicitly set
  location,
  enhancedAddress: enhancedAddress ?? undefined
};

// ✅ CORRECT - ExifData initialization
const exifData: ExifData = {
  location: undefined,
  dateTaken: undefined,
  camera: undefined,
  orientation: undefined
};
```

### **Nullish Coalescing Usage**

Always use `??` instead of `||` for undefined handling:

```typescript
// ✅ CORRECT
alt: imageData.alt ?? ''
address: address ?? undefined
enhancedAddress: data.enhancedAddress ?? undefined

// ❌ WRONG
alt: imageData.alt || ''              // Don't use ||
address: address || undefined         // Don't use ||
```

### **Component Props with Optional Callbacks**

```typescript
// ✅ CORRECT - Interface definition
interface ComponentProps {
  onSuccess: (() => void) | undefined;
  onError: ((error: string) => void) | undefined;
}

// ✅ CORRECT - Usage in component
export default function Component({ onSuccess, onError }: ComponentProps) {
  // Use optional chaining when calling
  onSuccess?.();
  onError?.('Error message');
}

// ✅ CORRECT - When passing props
<Component onSuccess={undefined} onError={undefined} />
```

## 🎯 ENFORCEMENT

1. **Before every commit**: Run `npm run type-check` - must pass with zero errors
2. **Code reviews**: Verify all interfaces follow explicit undefined pattern
3. **New code**: Always check against this document before writing
4. **AI assistants**: Must reference this document when making any TypeScript changes

## ⚡ QUICK REFERENCE

| Pattern | ❌ Wrong | ✅ Correct |
|---------|----------|-----------|
| Optional property | `name?: string` | `name: string \| undefined` |
| Nullish coalescing | `value \|\| undefined` | `value ?? undefined` |
| Empty string fallback | `val \|\| ''` | `val ?? ''` |
| Object creation | Missing properties | All properties explicit |
| Function props | `onClick?: () => void` | `onClick: (() => void) \| undefined` |
| Array access | `arr[0].prop` | `arr[0]?.prop` |

---

**Last Updated**: Project-wide refactor completed - All files now comply with strict mode
**Status**: ✅ All TypeScript checks passing with zero errors
