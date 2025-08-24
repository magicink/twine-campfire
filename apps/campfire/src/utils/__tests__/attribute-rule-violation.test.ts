// Test cases to verify attribute rule violations
import { describe, it, expect } from 'bun:test'
import { parseAttributeValue } from '../directiveUtils'

describe('Attribute rule violation tests', () => {
  it('should treat quoted JSON as string for object type', () => {
    const spec = { type: 'object' as const, required: false }
    const quotedJson = '"{\"key\": \"value\"}"'

    // This should return the string content, not parse as JSON
    const result = parseAttributeValue(quotedJson, spec)
    expect(result).toBe('{"key": "value"}') // Should be string, not object
  })

  it('should treat backticked JSON as string for object type', () => {
    const spec = { type: 'object' as const, required: false }
    const backtickJson = '`{"key": "value"}`'

    // This should return the string content, not parse as JSON
    const result = parseAttributeValue(backtickJson, spec)
    expect(result).toBe('{"key": "value"}') // Should be string, not object
  })

  it('should treat quoted JSON as string for array type', () => {
    const spec = { type: 'array' as const, required: false }
    const quotedArray = '"[1, 2, 3]"'

    // This should return the string content, not parse as JSON
    const result = parseAttributeValue(quotedArray, spec)
    expect(result).toBe('[1, 2, 3]') // Should be string, not array
  })

  it('should treat backticked JSON as string for array type', () => {
    const spec = { type: 'array' as const, required: false }
    const backtickArray = '`[1, 2, 3]`'

    // This should return the string content, not parse as JSON
    const result = parseAttributeValue(backtickArray, spec)
    expect(result).toBe('[1, 2, 3]') // Should be string, not array
  })

  it('should allow unquoted JSON for object type', () => {
    const spec = { type: 'object' as const, required: false }
    const unquotedJson = '{"key": "value"}'

    // This should parse as JSON since it's not quoted
    const result = parseAttributeValue(unquotedJson, spec)
    expect(result).toEqual({ key: 'value' }) // Should be object
  })

  it('should allow unquoted JSON for array type', () => {
    const spec = { type: 'array' as const, required: false }
    const unquotedArray = '[1, 2, 3]'

    // This should parse as JSON since it's not quoted
    const result = parseAttributeValue(unquotedArray, spec)
    expect(result).toEqual([1, 2, 3]) // Should be array
  })
})
