# TypeScript Strict Mode Rules

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
