function mkf() {
  # Retrieve last command from bash history
  local last_command=$(history | tail -n1 | awk '{print $2}')
  echo $last_command

  # Send command to OpenAI ChatGPT API and parse response for function name
  local res=$(curl -s -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{"prompt": "give a function name for this command: '"$last_command"'", "model": "text-davinci-002"}' \
    https://api.openai.com/v1/completions)
  echo $res

  local function_name=$(echo $res | jq '.choices[].text' | tr -d '"')

  # Generate bash function using function name and original command
  # local bash_function="$function_name() {\n\t$last_command\n}"

  # Output generated bash function to terminal
  # echo -e "$bash_function"
  echo $function_name
}
