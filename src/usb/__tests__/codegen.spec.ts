import { describe, it, expect } from 'vitest'
import { generateC, generateRust, type CodeDescriptor, type CodeElement } from '../codegen'

function el(name: string, comment: string, value: unknown, bytes: number[]): CodeElement {
    return { name, comment, value, toByteArray: () => new Uint8Array(bytes) }
}

function desc(
    name: string,
    index: number,
    elements: CodeElement[],
    children: CodeDescriptor[] = []
): CodeDescriptor {
    return { name, index, elements, children }
}

// A 4-byte element is the regression case: the byte count is a multiple of 4,
// which used to push the trailing comment onto an otherwise-empty line.
const fourByteDescriptor = () =>
    desc('Device Descriptor', 0, [el('bLength', 'Length of descriptor', 18, [0x12, 0x01, 0x00, 0x02])])

describe('generateC', () => {
    it('keeps the field comment on the last line that has bytes', () => {
        const lines = generateC([fourByteDescriptor()]).split('\n')

        const commentLine = lines.find((l) => l.includes('bLength: Length of descriptor'))
        expect(commentLine).toBeDefined()
        // The comment shares the line with the last byte, not a blank line.
        expect(commentLine).toMatch(/0x02,/)
        // No line consists of only whitespace followed by the comment.
        expect(lines.some((l) => /^\s+\/\* bLength/.test(l))).toBe(false)
    })

    it('includes the decoded string in the comment for string-valued elements', () => {
        const out = generateC([
            desc('String Descriptor', 1, [
                el('bString', 'String value', 'ha', [0x68, 0x00, 0x61, 0x00])
            ])
        ])
        expect(out).toContain('bString: String value "ha"')
    })

    it('emits a C array declaration', () => {
        const out = generateC([fourByteDescriptor()])
        expect(out).toContain('static const unsigned char DeviceDescriptor_0[] = {')
        expect(out).toContain('};')
    })
})

describe('generateRust', () => {
    it('emits an idiomatic sized static array with SCREAMING_SNAKE_CASE name', () => {
        const out = generateRust([fourByteDescriptor()])
        expect(out).toContain('static DEVICE_DESCRIPTOR_0: [u8; 4] = [')
        expect(out).toContain('];')
    })

    it('uses // line comments on the last line that has bytes', () => {
        const lines = generateRust([fourByteDescriptor()]).split('\n')
        const commentLine = lines.find((l) => l.includes('bLength: Length of descriptor'))
        expect(commentLine).toBeDefined()
        expect(commentLine).toMatch(/0x02,/)
        expect(commentLine).toContain('// bLength: Length of descriptor')
        // No blank-then-comment line.
        expect(lines.some((l) => /^\s+\/\/ bLength/.test(l) && !/0x/.test(l))).toBe(false)
    })

    it('indents array elements with four spaces', () => {
        const lines = generateRust([fourByteDescriptor()]).split('\n')
        expect(lines.some((l) => /^ {4}0x12,/.test(l))).toBe(true)
    })

    it('includes the decoded string in the comment for string-valued elements', () => {
        const out = generateRust([
            desc('String Descriptor', 1, [
                el('bString', 'String value', 'ha', [0x68, 0x00, 0x61, 0x00])
            ])
        ])
        expect(out).toContain('// bString: String value "ha"')
    })
})
