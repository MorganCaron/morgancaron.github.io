require "rouge"

module Jekyll
  module Tags
    class HighlightBlock
      def render_rouge(code)
        code += "\n" unless code.end_with?("\n")

        # highlight_lines
        base_formatter = Rouge::Formatters::HTMLLineHighlighter.new(
          Rouge::Formatters::HTML.new,
          highlight_lines: parse_highlighted_lines(@highlight_options[:highlight_lines])
        )

        # linenos
        formatter = if @highlight_options[:linenos]
                      Rouge::Formatters::HTMLTable.new(base_formatter, table_class: "rouge-table")
                    else
                      base_formatter
                    end

        lexer = ::Rouge::Lexer.find_fancy(@lang, code) || Rouge::Lexers::PlainText
        formatter.format(lexer.lex(code))
      end

      private

      def parse_highlighted_lines(lines_string)
        return [] if lines_string.nil?

        lines_string.map(&:to_i)
      end
    end
  end
end
