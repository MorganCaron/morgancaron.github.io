require 'nokogiri'

module Jekyll
	module ExternalLinksHighlighter
		def self.external_url?(url, site_url)
			url_str = url.to_s.strip
			# Ne considérer que les liens HTTP/HTTPS
			return false unless url_str.start_with?('http://', 'https://')

			# Si site_url est configuré, exclure les liens internes absolus
			if site_url
				normalized_site = site_url.to_s.strip.chomp('/')
				return false if url_str.start_with?(normalized_site)
			end

			true
		end
	end
end

[:pages, :documents].each do |owner|
	Jekyll::Hooks.register owner, :post_render do |doc|
		next unless doc.output_ext == '.html'

		site_url = doc.site.config['url']
		html = Nokogiri::HTML(doc.output)
		modified = false

		html.css('a').each do |link|
			href = link['href']
			next if href.nil? || href.strip.empty?

			if Jekyll::ExternalLinksHighlighter.external_url?(href, site_url)
				classes = (link['class'] || '').split(' ')
				unless classes.include?('external-link')
					classes << 'external-link'
					link['class'] = classes.join(' ')
					modified = true
				end
			end
		end

		doc.output = html.to_html if modified
	end
end
