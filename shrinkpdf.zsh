function shrinkpdf() {
  # gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=output.pdf pportpages.pdf
  #  $>  compress_pdf sample.pdf output.pdf /screen
  local input_file=$1
  local output_file=${2:-"compressed_$(basename $1)"}
  local compression_level=${3:-"/ebook"}

  if [[ ! -f $input_file ]]; then
    echo "Input file $input_file does not exist"
    return 1
  fi

  gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=$compression_level -dNOPAUSE -dQUIET -dBATCH -sOutputFile=$output_file $input_file

  echo "PDF compressed successfully. Output file: $output_file"
}
