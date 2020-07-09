/** @jsx jsx */
import React from "react"
import { jsx, Flex, Grid } from "strict-ui"
import { useQuery, useMutation } from "urql"
import {
  Heading,
  HeadingProps,
  Text,
  Button,
  InputField,
  InputFieldControl,
  ButtonProps,
  InputFieldLabel,
} from "gatsby-interface"
import PageEmbed from "../components/pageembed"

const SecondaryButton: React.FC<ButtonProps> = props => (
  <Button
    variant="SECONDARY"
    size="S"
    sx={{
      paddingX: 6,
      paddingY: 4,
    }}
    {...props}
  ></Button>
)

const InstallInput: React.FC<{ for: string }> = props => {
  const inputId = `install-${props.for}`
  const [value, setValue] = React.useState(``)

  const [{ fetching }, installGatbyPlugin] = useMutation(`
    mutation installGatsbyPlugin($name: String!) {
      createNpmPackage(npmPackage: {
        name: $name,
        dependencyType: "production"
      }) {
        id
        name
      }
      createGatsbyPlugin(gatsbyPlugin: {
        name: $name
      }) {
        id
        name
      }
    }
  `)

  return (
    <form
      onSubmit={(evt): void => {
        evt.preventDefault()
        if (value.indexOf(`gatsby-`) !== 0) return

        installGatbyPlugin({
          name: value,
        })
      }}
    >
      <InputField id={inputId}>
        <Flex gap={2} flexDirection="column">
          <InputFieldLabel>Install {props.for}:</InputFieldLabel>
          <Flex gap={4} alignItems="center">
            <InputFieldControl
              placeholder={`gatsby-${props.for}-`}
              disabled={fetching}
              value={value}
              onChange={(e): void => setValue(e.target.value)}
              sx={{
                width: `initial`,
              }}
            />
            <SecondaryButton
              disabled={!value.trim()}
              loading={fetching}
              loadingLabel="Installing"
            >
              Install
            </SecondaryButton>
          </Flex>
        </Flex>
      </InputField>
    </form>
  )
}

const DestroyButton: React.FC<{ name: string }> = ({ name }) => {
  const [, deleteGatsbyPlugin] = useMutation(`
    mutation destroyGatsbyPlugin($name: String!) {
      destroyNpmPackage(npmPackage: {
        name: $name,
        id: $name,
        dependencyType: "production"
      }) {
        id
        name
      }
      destroyGatsbyPlugin(gatsbyPlugin: {
        name: $name,
        id: $name
      }) {
        id
        name
      }
    }
  `)

  return (
    <SecondaryButton
      onClick={(evt): void => {
        evt.preventDefault()
        if (window.confirm(`Are you sure you want to uninstall ${name}?`)) {
          deleteGatsbyPlugin({ name })
        }
      }}
    >
      Uninstall
    </SecondaryButton>
  )
}

const SectionHeading: React.FC<HeadingProps> = props => (
  <Heading as="h1" sx={{ fontWeight: `500`, fontSize: 5 }} {...props} />
)

const PluginCard: React.FC<{
  plugin: { name: string; description?: string }
}> = ({ plugin }) => (
  <Flex
    flexDirection="column"
    gap={6}
    sx={{
      backgroundColor: `ui.background`,
      padding: 5,
      borderRadius: 2,
      boxShadow: `floating`,
    }}
  >
    <Heading as="h2" sx={{ fontWeight: `500`, fontSize: 3 }}>
      {plugin.name}
    </Heading>
    <Text sx={{ color: `text.secondary` }}>
      {plugin.description || <em>No description.</em>}
    </Text>
    <Flex justifyContent="flex-end" sx={{ width: `100%` }}>
      <DestroyButton name={plugin.name} />
    </Flex>
  </Flex>
)

const Index: React.FC<{}> = () => {
  const [{ data, fetching, error }] = useQuery({
    query: `
      {
        allGatsbyPlugin {
          nodes {
            name
            description
            id
            shadowedFiles
            shadowableFiles
          }
        }
        allGatsbyPage {
          nodes {
            path
          }
        }
      }
    `,
  })

  if (fetching) return <p>Loading...</p>

  if (error) return <p>Oops something went wrong.</p>

  return (
    <Flex gap={7} flexDirection="column" sx={{ paddingY: 7, paddingX: 6 }}>
      {!window ||
        (!window.frameElement && (
          <Flex gap={7} flexDirection="column">
            <SectionHeading>Pages</SectionHeading>
            <Grid gap={6} columns={[1, 1, 1, 2, 3]}>
              {data.allGatsbyPage.nodes
                .filter(page => page.path.indexOf(`/dev-404-page/`) !== 0)
                .map(page => (
                  <Flex
                    gap={5}
                    flexDirection="column"
                    sx={{ width: `100%`, textAlign: `center` }}
                  >
                    <PageEmbed height={400} src={page.path} />
                    <Text sx={{ color: `text.secondary` }}>{page.path}</Text>
                  </Flex>
                ))}
            </Grid>
          </Flex>
        ))}
      <SectionHeading>Plugins</SectionHeading>
      <Grid gap={6} columns={[1, 1, 1, 2, 3]}>
        {data.allGatsbyPlugin.nodes
          .filter(plugin => plugin.name.indexOf(`gatsby-plugin`) === 0)
          .map(plugin => (
            <PluginCard key={plugin.id} plugin={plugin} />
          ))}
      </Grid>
      <InstallInput for="plugin" />

      <SectionHeading>Themes</SectionHeading>
      <Grid gap={6} columns={[1, 1, 1, 2, 3]}>
        {data.allGatsbyPlugin.nodes
          .filter(plugin => plugin.name.indexOf(`gatsby-theme`) === 0)
          .map(plugin => (
            <PluginCard key={plugin.id} plugin={plugin} />
          ))}
      </Grid>

      <InstallInput for="theme" />
    </Flex>
  )
}

export default Index
