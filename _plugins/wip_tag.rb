module Jekyll
	class WipTag < Liquid::Tag
		def initialize(tag_name, text, tokens)
			super
		end
  
		def render(context)
			"<div class='work-in-progress'>Work in progress</div>"
		end
	end
end

Liquid::Template.register_tag('wip', Jekyll::WipTag)
