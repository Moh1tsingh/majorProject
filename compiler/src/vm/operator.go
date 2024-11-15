package vm

import "encoding/binary"

const (
	OpConstant OpCode = iota
	OpAddition
	OpSubtraction
	OpMultiplication
	OpDivision
	OpNegation
	OpTrue
	OpFalse
	OpEqual
	OpNotEqual
	OpGreaterThan
	OpBooleanInversion
	OpJumpNotTruthy
	OpJump
	OpSetGlobal
	OpGetGlobal
)

type OperatorDefinition struct {
	Name          string
	OperandWidths []int
}

var OperatorDefinitions = map[OpCode]*OperatorDefinition{
	OpConstant: {
		Name:          "OpConstant",
		OperandWidths: []int{2},
	},
	OpAddition: {
		Name: "OpAddition",
	},
	OpSubtraction: {
		Name: "OpSubtraction",
	},
	OpMultiplication: {
		Name: "OpMultiplication",
	},
	OpDivision: {
		Name: "OpDivision",
	},
	OpNegation: {
		Name: "OpNegation",
	},
	OpTrue: {
		Name: "OpTrue",
	},
	OpFalse: {
		Name: "OpFalse",
	},
	OpEqual: {
		Name: "OpEqual",
	},
	OpNotEqual: {
		Name: "OpNotEqual",
	},
	OpGreaterThan: {
		Name: "OpGreaterThan",
	},
	OpBooleanInversion: {
		Name: "OpBooleanInversion",
	},
	OpJumpNotTruthy: {
		Name:          "OpJumpNotTruthy",
		OperandWidths: []int{2},
	},
	OpJump: {
		Name:          "OpJump",
		OperandWidths: []int{2},
	},
	OpGetGlobal: {
		Name:          "OpGetGlobal",
		OperandWidths: []int{2},
	},
	OpSetGlobal: {
		Name:          "OpSetGlobal",
		OperandWidths: []int{2},
	},
}

func MakeInstruction(op OpCode, operands ...int) []byte {
	var def, ok = OperatorDefinitions[op]
	if !ok {
		return []byte{}
	}

	var instructionLen int = 0
	instructionLen += 1

	for _, s := range def.OperandWidths {
		instructionLen += s
	}

	var ins = make([]byte, instructionLen)
	ins[0] = byte(op)
	var offset = 1

	for i, operand := range operands {
		var operandWidth = def.OperandWidths[i]
		switch operandWidth {
		case 1:
			ins[offset] = byte(operand)
		case 2:
			binary.BigEndian.PutUint16(ins[offset:], uint16(operand))
		}
		offset += operandWidth
	}
	return ins
}
