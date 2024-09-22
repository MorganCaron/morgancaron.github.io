module Jekyll
	class GifTag < Liquid::Tag
		def initialize(tag_name, url, tokens)
			super
			@url = url.strip
		end
  
		def render(context)
			"<div class='text-center'><img src='#{@url}' width='500'></div>"
		end
	end
end

Liquid::Template.register_tag('gif', Jekyll::GifTag)
