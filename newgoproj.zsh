newgoproj() {
  if [ $# -eq 0 ]; then
    echo "Please provide a directory name."
    return 1
  fi

  project_dir=$1
  mkdir -p "$project_dir"/cmd/myapp "$project_dir"/pkg/{config,database,models,handlers,utils} "$project_dir"/internal/middleware
  echo "Created Go project directory layout under: $project_dir"

  # Initialize Go module
  cd "$project_dir" || return 1
  go mod init "${project_dir##*/}"

  # Create a small "Hello, World!" Go program
  cat >cmd/myapp/main.go <<-EOM
package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
}
EOM

  # Create Dockerfile with the official Go Docker image
  cat >Dockerfile <<-EOM
FROM golang:1.17

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o main ./cmd/myapp

CMD ["./main"]
EOM

  # Create README.md with instructions
  cat >README.md <<-EOM
# Go Project with Docker

This is a small Go project with a "Hello, World!" program, set up with a Docker container.

## Building the Docker Image

To build the Docker image, run the following command in the project directory:

\`\`\`
docker build -t go-docker-hello-world .
\`\`\`

## Running the Docker Container

To run the Docker container, execute the following command:

\`\`\`
docker run --rm go-docker-hello-world
\`\`\`

This command will run the container and print "Hello, World!" to the console.
EOM

  cd - >/dev/null
}
