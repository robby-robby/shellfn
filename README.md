# Shellfn

Shellfn is a collection of useful zshell functions that help you automate and simplify various tasks related to Dokku, chatgpt, postgres, go and other aspects of your development workflow.

## Installation

`git clone https://github.com/robby-robby/shellfn $HOME/shellfn && echo 'for file in $HOME/shellfn/*.zsh; do source "$file" done' >> $HOME/.zshrc`

## Usage

### Dokku Functions

- `dokku`: Wrapper function for various Dokku tasks.

### Hey Functions

- `hey`: Query GPT-3.5-turbo for a natural language response.
- `heyc`: A utility for fetching code snippets from GPT-3.5-turbo.
- `heycode`: Fetch code snippets from GPT-3.5-turbo using an interactive Vim buffer.
- `heycoce`: Alias for `heycode`.

### Fiddle Function

- `fiddle`: Function for interacting with a PostgreSQL database named "fiddle".

## Dokku Functions

This collection of functions helps you manage your Dokku deployments. Functions include creating new apps, pushing changes, configuring domains, and opening apps in your browser. Examples of usage include:

- `dokku init`: Initialize a new Dokku app in the current directory.
- `dokku push`: Push changes to the Dokku master branch.
- `dokku wire`: Add a new subdomain to /etc/hosts.
- `dokku unwire`: Remove a subdomain from /etc/hosts.
- `dokku open`: Open the Dokku app in your default web browser.

## Hey Functions

These functions let you interact with GPT-3.5-turbo to get responses in natural language or code snippets.

- `hey`: Ask GPT-3.5-turbo a question and get a response in natural language.
- `heyc`: Fetch code snippets from GPT-3.5-turbo for a specific prompt.
- `heycode`: Use an interactive Vim buffer to edit the prompt and fetch code snippets from GPT-3.5-turbo.
- `heycoce`: Alias for `heycode`.

## Fiddle Function

The `fiddle` function is a utility for interacting with a PostgreSQL database named "fiddle". It allows you to create, drop, and run SQL queries on the database. Examples of usage include:

- `fiddle new`: Drop the current "fiddle" database and create a new one.
- `fiddle vim`: Open a Vim buffer to write an SQL query and execute it on the "fiddle" database.
- `fiddle <sql-file>`: Run an SQL file on the "fiddle" database.

## License

This project is licensed under the MIT License.
