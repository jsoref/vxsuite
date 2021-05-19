import React from 'react'
import { Screen, Main, MainChild, Prose, fontSizeTheme } from '@votingworks/ui'
import { ElectionDefinition, Precinct } from '@votingworks/types'
import ElectionInfoBar, { InfoBarMode } from './ElectionInfoBar'

interface Props {
  children?: React.ReactNode
  infoBar?: boolean
  infoBarMode?: InfoBarMode
  electionDefinition?: ElectionDefinition
  currentPrecinctId?: Precinct['id']
}

export const CenteredScreen: React.FC<Props> = ({
  children,
  infoBar = true,
  infoBarMode,
  electionDefinition,
  currentPrecinctId,
}) => (
  <Screen flexDirection="column">
    <Main padded>
      <MainChild center maxWidth={false}>
        {children}
      </MainChild>
    </Main>
    {infoBar && (
      <ElectionInfoBar
        mode={infoBarMode}
        electionDefinition={electionDefinition}
        currentPrecinctId={currentPrecinctId}
      />
    )}
  </Screen>
)

export const CenteredLargeProse: React.FC<Props> = ({ children }) => (
  <Prose textCenter maxWidth={false} theme={fontSizeTheme.large}>
    {children}
  </Prose>
)