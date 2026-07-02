import { describe, it, expect } from 'vitest'
import { StringElement, ConstantElement, VariableElement } from '../elements'

// USB string descriptors encode bString as UTF-16LE (2 bytes per code unit),
// not ASCII/UTF-8. See USB 2.0 spec §9.6.7. Regression test for issue #3.
describe('StringElement (USB string descriptor bString)', () => {
  function make(value: string): StringElement {
    const el = new StringElement('bString', 'String value')
    el.value = value
    return el
  }

  it('encodes an ASCII string as UTF-16LE', () => {
    expect(Array.from(make('USB').toByteArray())).toEqual([
      0x55, 0x00, // U
      0x53, 0x00, // S
      0x42, 0x00 // B
    ])
  })

  it('reports length as two bytes per character (UTF-16LE)', () => {
    expect(make('USB').length()).toBe(6)
  })

  it('encodes a non-ASCII BMP character little-endian', () => {
    // U+20AC EURO SIGN -> AC 20 little-endian
    expect(Array.from(make('€').toByteArray())).toEqual([0xac, 0x20])
    expect(make('€').length()).toBe(2)
  })

  it('encodes a Latin-1 character as two bytes with a zero high byte', () => {
    // U+00E9 LATIN SMALL LETTER E WITH ACUTE -> E9 00
    expect(Array.from(make('é').toByteArray())).toEqual([0xe9, 0x00])
  })

  it('handles the empty string', () => {
    expect(Array.from(make('').toByteArray())).toEqual([])
    expect(make('').length()).toBe(0)
  })
})

// Mass Storage CBW/CSW need fields wider than 4 bytes (16-byte CBWCB) and
// correct validation of 4-byte fields (dCBWTag) — see issue: base Element
// only handled 1/2/4-byte encoding and VariableElement.isValid overflowed.
describe('wide numeric fields', () => {
  it('encodes a 4-byte constant little-endian', () => {
    const sig = new ConstantElement('dCBWSignature', '', 4, 0x43425355)
    expect(Array.from(sig.toByteArray())).toEqual([0x55, 0x53, 0x42, 0x43]) // "USBC"
  })

  it('encodes an arbitrary-width (16-byte) field as N little-endian bytes', () => {
    const block = new ConstantElement('CBWCB', '', 16, 0)
    expect(Array.from(block.toByteArray())).toEqual(new Array(16).fill(0))
  })

  it('validates 4-byte values without 32-bit shift overflow', () => {
    const tag = new VariableElement('dCBWTag', '', 4, 'dec')
    tag.value = 0x12345678
    expect(tag.isValid()).toBe(true)
    tag.value = 0xffffffff
    expect(tag.isValid()).toBe(true)
  })
})
