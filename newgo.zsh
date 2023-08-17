newgo() {
  if [ $# -eq 0 ]; then
    echo "Please provide a project/directory name."
    return 1
  fi

  project_dir=$1
  mkdir -p "${project_dir}"/{api,assets,build/ci,build/package,cmd/$project_dir,configs,deployments,docs,examples,githooks,init,internal/app/$project_dir,internal/pkg/$project_dir,pkg/$project_dir,scripts,test,third_party,tools,vendor,web/app,web/static,web/template,website}

  # find ${project_dir} -type d -exec touch {}/.keep \;
  echo "Created Go project directory layout under: $project_dir"

  # Initialize Go module
  cd "$project_dir" || return 1
  go mod init "${project_dir##*/}"
  touch go.sum

  # Create a small "Hello, World!" Go program
  cat >"cmd/${project_dir}/main.go" <<-EOM
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

RUN go build -o main ./cmd/${project_dir}

CMD ["./main"]
EOM

  # Create README.md with instructions
  cat >README.md <<-EOM
# Go Project with Docker

This is a small Go project with a "Hello, World!" program, set up with a Docker container.

## Building the Docker Image

To build the Docker image, run the following command in the project directory:

\`\`\`
make build
\`\`\`

## Running the Docker Container

To run the Docker container, execute the following command:

\`\`\`
make run
\`\`\`

This command will run the container and print "Hello, World!" to the console.


## Local development using Air

To run the local development server, execute the following command:

\`\`\`
air
\`\`\`

air should be installed, install air with the following command:

\`\`\`
go get -u github.com/cosmtrek/air
\`\`\`

EOM

  cat >"makefile" <<EOM
.PHONY: build run

build:
		docker build -t go-docker-${project_dir} .

run:
	 	docker run --rm go-docker-${project_dir}

EOM

  find . -type d -empty -exec touch {}/.keep \;

  air init

  build_string="go build -o ./tmp/main ./cmd/${project_dir}"

  perl -i -pe "s|^  cmd = \".*\"|  cmd = \"$build_string\"|" .air.toml

  cat >".gitignore" <<EOM
tmp
*.ignore.*
.DS_Store
vendor
EOM

  git init .

  git add .

  git commit -m "first via newgo command"

  #cd - >/dev/null
}
# newgo___() {
#   if [ $# -eq 0 ]; then
#     echo "Please provide a project/directory name."
#     return 1
#   fi

#   project_dir=$1
#   mkdir -p "$project_dir/cmd/${project_dir}" "$project_dir"/pkg/{config,database,models,handlers,utils} "$project_dir"/internal/middleware
#   echo "Created Go project directory layout under: $project_dir"

#   # Initialize Go module
#   cd "$project_dir" || return 1
#   go mod init "${project_dir##*/}"
#   touch go.sum

#   # Create a small "Hello, World!" Go program
#   cat >"cmd/${project_dir}/main.go" <<-EOM
# package main

# import "fmt"

# func main() {
# 	fmt.Println("Hello, World!")
# }
# EOM

#   # Create Dockerfile with the official Go Docker image
#   cat >Dockerfile <<-EOM
# FROM golang:1.17

# WORKDIR /app

# COPY go.mod go.sum ./
# RUN go mod download

# COPY . .

# RUN go build -o main ./cmd/${project_dir}

# CMD ["./main"]
# EOM

#   # Create README.md with instructions
#   cat >README.md <<-EOM
# # Go Project with Docker

# This is a small Go project with a "Hello, World!" program, set up with a Docker container.

# ## Building the Docker Image

# To build the Docker image, run the following command in the project directory:

# \`\`\`
# make build
# \`\`\`

# ## Running the Docker Container

# To run the Docker container, execute the following command:

# \`\`\`
# make run
# \`\`\`

# This command will run the container and print "Hello, World!" to the console.
# EOM

#   cat >"makefile" <<EOM
# .PHONY: build run

# build:
# 		docker build -t go-docker-${project_dir} .

# run:
# 	 	docker run --rm go-docker-${project_dir}

# EOM

#   find . -type d -empty -exec touch {}/.keep \;

#   air init

#   build_string="go build -o ./tmp/main ./cmd/${project_dir}"

#   perl -i -pe "s|^  cmd = \".*\"|  cmd = \"$build_string\"|" .air.toml

#   cat >".gitignore" <<EOM
#   ./tmp
#   *.ignore.*
#   .DS_Store
# EOM

#   git init .

#   git add .

#   git commit -m "first via newgo command"

#   #cd - >/dev/null
# }
