module Jekyll
	class GifTag < Liquid::Tag
		def initialize(tag_name, url, tokens)
			super
			@url = url.strip
		end
  
		def render(context)
			filename = File.basename(@url, ".*")
			alt_text = filename.gsub("-", " ").capitalize
			"<div class='text-center'><img src='#{@url}' alt='#{alt_text}' width='500'></div>"
		end
	end
end

Liquid::Template.register_tag('gif', Jekyll::GifTag)
