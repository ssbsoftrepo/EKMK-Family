package com.ekmk.familytree.service;

import com.ekmk.familytree.model.AppSetting;
import com.ekmk.familytree.repository.AppSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Editable site settings. Only the keys listed in {@link #DEFAULTS} exist;
 * anything else sent by a client is ignored.
 *
 * WhatsApp messages are plain text templates. {name} becomes the person's
 * first name and {site} the website link. They are sent through ordinary
 * https://wa.me links on the visitor's own phone: no WhatsApp API or account.
 */
@Service
@Transactional
public class SettingsService {

    public static final int MAX_LENGTH = 1000;

    public static final Map<String, String> DEFAULTS;

    static {
        Map<String, String> d = new LinkedHashMap<>();
        d.put("siteUrl", "");
        d.put("homePhotoUrl", "");
        d.put("whatsappBirthday", "Happy birthday {name}! Wishing you a wonderful year ahead. With love, from the KMK family");
        d.put("whatsappHello", "Hi {name}, I found you on our KMK family website! {site}");
        d.put("whatsappShare", "Hello everyone! Our KMK family website is ready. Find yourself on the family tree: {site}");
        DEFAULTS = Map.copyOf(d);
    }

    /** Settings that may be left empty (the messages fall back to their defaults instead). */
    private static final java.util.Set<String> OPTIONAL = java.util.Set.of("siteUrl", "homePhotoUrl");

    private final AppSettingRepository repository;

    public SettingsService(AppSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Map<String, String> getAll() {
        Map<String, String> out = new LinkedHashMap<>();
        for (String key : orderedKeys()) {
            out.put(key, repository.findById(key).map(AppSetting::getValue).orElse(DEFAULTS.get(key)));
        }
        return out;
    }

    public Map<String, String> update(Map<String, String> changes) {
        if (changes != null) {
            for (Map.Entry<String, String> e : changes.entrySet()) {
                if (!DEFAULTS.containsKey(e.getKey())) {
                    continue;
                }
                String value = e.getValue() == null ? "" : e.getValue().trim();
                if (value.length() > MAX_LENGTH) {
                    throw new IllegalArgumentException("Message is too long (more than " + MAX_LENGTH + " letters)");
                }
                if (value.isEmpty() && !OPTIONAL.contains(e.getKey())) {
                    // An empty message would make the button useless: go back to the default.
                    repository.deleteById(e.getKey());
                } else {
                    repository.save(new AppSetting(e.getKey(), value));
                }
            }
        }
        return getAll();
    }

    private static String[] orderedKeys() {
        return new String[] {"siteUrl", "homePhotoUrl", "whatsappBirthday", "whatsappHello", "whatsappShare"};
    }
}
