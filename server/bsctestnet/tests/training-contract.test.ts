import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { CounterIncremented } from "../generated/schema"
import { CounterIncremented as CounterIncrementedEvent } from "../generated/TrainingContract/TrainingContract"
import { handleCounterIncremented } from "../src/training-contract"
import { createCounterIncrementedEvent } from "./training-contract-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let user = Address.fromString("0x0000000000000000000000000000000000000001")
    let newValue = BigInt.fromI32(234)
    let newCounterIncrementedEvent = createCounterIncrementedEvent(
      user,
      newValue
    )
    handleCounterIncremented(newCounterIncrementedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("CounterIncremented created and stored", () => {
    assert.entityCount("CounterIncremented", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CounterIncremented",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "user",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CounterIncremented",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newValue",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
