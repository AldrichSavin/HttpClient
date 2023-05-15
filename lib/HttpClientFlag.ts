export enum HttpClientFlag {
  /**
   * The request is allowed not authorized.
   */
  ALLOWED_NOT_AUTHORIZED = "ALLOWED_NOT_AUTHORIZED",
}

export enum ContentOptionalTypes {
  /**
   *
   */
  JSON = "JSON",
  /**
   *
   */
  FORM = "FORM",
  /**
   *
   */
  MULTIPART = "MULTIPART",
  /**
   *
   */
  TEXT = "TEXT",
  /**
   *
   */
  BLOB = "BLOB",
  /**
   *
   */
  XML = "XML",
  /**
   *
   */
  JSON_PATCH = "JSON_PATCH",
}

export type ContentTypeOptionalKeys = keyof typeof ContentOptionalTypes;
export type ContentTypeOptionalValues = (typeof ContentOptionalTypes)[ContentTypeOptionalKeys];
