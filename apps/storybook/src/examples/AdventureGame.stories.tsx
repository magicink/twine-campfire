import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from '../DebugWindow'

const meta: Meta = {
  title: 'Campfire/Examples/AdventureGame'
}

export default meta

/**
 * Interactive adventure game showcasing multiple Campfire directives working
 * together within a branching narrative.
 *
 * @returns Story configuration for the adventure game example.
 */
export const AdventureGame: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
Hello adventurer! Enter your name:
::input[playerName]{placeholder="Your name"}

:::if[(playerName && playerName.trim())]
  :::trigger{label="Continue"}
    ::goto["ChooseClass"]
  :::
:::
`}
        </tw-passagedata>
        <tw-passagedata pid='2' name='ChooseClass'>
          {`
::preset{type="wrapper" name="classChoice" as="label" className="flex items-center gap-2"}

Greetings, :show[playerName]{className="font-semibold"}! Choose your class:

:::layer{className="flex flex-col gap-3 mt-4"}
  :::wrapper{from="classChoice"}
    ::radio[playerClass]{value="Warrior"}
    Warrior
  :::
  :::wrapper{from="classChoice"}
    ::radio[playerClass]{value="Mage"}
    Mage
  :::
:::

:::if[(playerClass && playerClass.trim())]
  You have chosen the path of the :show[playerClass]{className="font-semibold"}.

  :::trigger{label="Begin your adventure"}
    ::goto["Adventure"]
  :::
:::
`}
        </tw-passagedata>
        <tw-passagedata pid='3' name='Adventure'>
          {`
:::if[(!hpInitialized)]
  ::setOnce[hpInitialized=true]
  ::createRange[hp=10]{min=0 max=10}
:::

::arrayOnce[inventory=[]]

:show[playerName]{className="font-semibold"}, the :show[playerClass]{className="font-semibold"}, stands at an ancient crossroads.

Current HP: :show[hp.value]{className="font-bold"} / :show[hp.max]

Two paths beckon:

:::trigger{label="Enter the forest"}
  ::goto["Forest"]
:::

:::trigger{label="Explore the cave"}
  ::goto["Cave"]
:::
`}
        </tw-passagedata>
        <tw-passagedata pid='4' name='Forest'>
          {`
:::if[(!forestDamageApplied)]
  ::set[forestDamageApplied=true]
  ::setRange[hp=(hp.value-2)]
:::

A snarling wolf lunges from the underbrush!

Current HP: :show[hp.value]{className="font-bold"}

:::if[(hp.value>0)]
  Bloodied but unbroken, you scan the forest floor.

  :::trigger{label="Collect healing herbs"}
    ::goto["Herbs"]
  :::

  :::trigger{label="Retreat to the crossroads"}
    ::goto["Adventure"]
  :::
:::

:::if[(hp.value<=0)]
  The beast's fangs prove fatal.

  :::trigger{label="Succumb to the darkness"}
    ::goto["Dead"]
  :::
:::

:::onExit
  ::unset[forestDamageApplied]
:::
`}
        </tw-passagedata>
        <tw-passagedata pid='5' name='Herbs'>
          {`
:::if[(!herbsCollected)]
  ::set[herbsCollected=true]
  ::push{key=inventory value="Herbs"}
:::

You gather fragrant herbs and bandage your wounds before returning.

:::trigger{label="Back to the crossroads"}
  ::goto["Adventure"]
:::

:::onExit
  ::unset[herbsCollected]
:::
`}
        </tw-passagedata>
        <tw-passagedata pid='6' name='Cave'>
          {`
:::if[(!caveTrapTriggered)]
  ::set[caveTrapTriggered=true]
  ::setRange[hp=(hp.value-3)]
:::

A hidden trap releases a volley of darts as you step inside the cave!

Current HP: :show[hp.value]{className="font-bold"}

:::if[(hp.value>0)]
  :::if[(!caveLootGranted)]
    ::set[caveLootGranted=true]
    ::push{key=inventory value="Gold"}
  :::
  The trap spent, a cache of glittering coins remains.

  :::if[(inventory && inventory.length)]
    Your pack now holds:
    :::for[item in inventory]
      - :show[item]
    :::
  :::

  :::trigger{label="Return to the crossroads"}
    ::goto["Adventure"]
  :::
:::

:::if[(hp.value<=0)]
  The darts strike true. Darkness closes in.

  :::trigger{label="Fall to your fate"}
    ::goto["Dead"]
  :::
:::

:::onExit
  :::batch
    ::unset[caveTrapTriggered]
    ::unset[caveLootGranted]
  :::
:::
`}
        </tw-passagedata>
        <tw-passagedata pid='7' name='Dead'>
          {`
:::layer{className="space-y-3"}
  :::wrapper
    Your vision fades as the world slips away.
  :::

  :::wrapper
    :::trigger{label="Begin anew"}
      ::goto["Start"]
    :::
  :::

  :::wrapper
    :::onExit
    :::batch
      ::unset[playerName]
      ::unset[playerClass]
      ::unset[hp]
      ::unset[hpInitialized]
      ::unset[inventory]
      ::unset[forestDamageApplied]
      ::unset[herbsCollected]
      ::unset[caveTrapTriggered]
      ::unset[caveLootGranted]
    :::
  :::
:::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}
