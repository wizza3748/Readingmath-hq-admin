export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

const DENIED_MESSAGE = 'Firestore Security Rules Denied Request:';

/**
 * A custom error class for Firestore permission errors. This error is thrown
 * when a Firestore operation is denied by security rules. It includes a
 * `context` object that provides detailed information about the request that
 * was denied, which is invaluable for debugging security rules in development.
 */
export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    // We construct a detailed error message that will be displayed in the
    // Next.js development error overlay. This message includes the context
    // of the request that was denied, making it much easier to debug.
    const message = `
${DENIED_MESSAGE}
${JSON.stringify(context, null, 2)}
`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is a workaround to make the error message display correctly
    // in the Next.js development error overlay.
    if (typeof (this as any).stack === 'string') {
      (this as any).stack = (this as any).stack.replace(
        /^Error: /,
        `Error: ${this.name}: `
      );
    }
  }
}
