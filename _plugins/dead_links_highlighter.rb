require 'nokogiri'
require 'set'

module Jekyll
	module DeadLinksHighlighter
		def self.normalize_url(url)
			u = url.to_s.strip.chomp('/')
			u = u.sub(/\.html$/, '')
			u = u.sub(/\/index$/, '')
			u = '/' + u unless u.start_with?('/') || u.empty?
			u
		end
	end
end

Jekyll::Hooks.register :site, :post_read do |site|
	valid_urls = Set.new
	
	# Récupérer toutes les pages classiques
	site.pages.each { |p| valid_urls << Jekyll::DeadLinksHighlighter.normalize_url(p.url) }
	
	# Récupérer tous les documents des collections (articles, posts, etc)
	site.collections.each do |_, collection|
		collection.docs.each { |doc| valid_urls << Jekyll::DeadLinksHighlighter.normalize_url(doc.url) }
	end
	
	site.config['all_valid_urls'] = valid_urls
end

[:pages, :documents].each do |owner|
	Jekyll::Hooks.register owner, :post_render do |doc|
		next unless doc.output_ext == '.html'

		valid_urls = doc.site.config['all_valid_urls']
		next if valid_urls.nil?

		html = Nokogiri::HTML(doc.output)
		modified = false

		# Déterminer le dossier de base pour résoudre les chemins relatifs
		base_dir = doc.url.end_with?('/') ? doc.url : File.dirname(doc.url)

		html.css('a').each do |link|
			href = link['href']
			next if href.nil? || href.strip.empty?

			# Ignorer les liens externes, les ancres, les e-mails, les numéros de téléphone et le javascript
			next if href =~ %r{^(https?:|mailto:|tel:|#|javascript:)}

			# Ignorer les assets et fichiers statiques
			next if href.start_with?('/assets/') || href =~ /\.(png|jpg|jpeg|gif|svg|pdf|zip)$/i

			# Nettoyer l'URL (enlever les ancres et paramètres de requêtes)
			clean_href = href.split('#').first.split('?').first
			next if clean_href.strip.empty?

			# Résoudre les URL relatives par rapport au document actuel
			resolved_href = clean_href.start_with?('/') ? clean_href : File.expand_path(clean_href, base_dir)
			
			normalized_href = Jekyll::DeadLinksHighlighter.normalize_url(resolved_href)

			# Si la page ou l'article n'existe pas, on ajoute la classe "dead-link"
			unless valid_urls.include?(normalized_href)
				classes = (link['class'] || '').split(' ')
				unless classes.include?('dead-link')
					classes << 'dead-link'
					link['class'] = classes.join(' ')
					modified = true
				end
			end
		end

		doc.output = html.to_html if modified
	end
end
