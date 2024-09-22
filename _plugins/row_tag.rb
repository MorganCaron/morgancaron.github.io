module Jekyll
	class RowTag < Liquid::Block
		def initialize(tag_name, text, tokens)
			super
		end
  
		def render(context)
			content = Kramdown::Document.new(super.strip).to_html
			"<div class='row'>#{content}</div>"
		end
	end
end

Liquid::Template.register_tag('row', Jekyll::RowTag)
