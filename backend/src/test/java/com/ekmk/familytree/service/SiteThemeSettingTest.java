package com.ekmk.familytree.service;

import com.ekmk.familytree.model.AppSetting;
import com.ekmk.familytree.repository.AppSettingRepository;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** The family website's look (siteTheme): Family Album by default, only known looks accepted. */
class SiteThemeSettingTest {

    private final AppSettingRepository repository = mock(AppSettingRepository.class);
    private final SettingsService settings = new SettingsService(repository);

    @Test
    void familyAlbumIsTheDefault() {
        when(repository.findById(anyString())).thenReturn(Optional.empty());
        assertEquals("album", settings.getAll().get("siteTheme"));
    }

    @Test
    void albumCanBeChosen() {
        when(repository.findById(anyString())).thenReturn(Optional.empty());
        settings.update(Map.of("siteTheme", "album"));
        verify(repository).save(any(AppSetting.class));
    }

    @Test
    void kaveriIsRefused() {
        assertThrows(IllegalArgumentException.class, () -> settings.update(Map.of("siteTheme", "kaveri")));
        verify(repository, never()).save(any(AppSetting.class));
    }

    @Test
    void staleKaveriFallsBackToAlbum() {
        when(repository.findById("siteTheme")).thenReturn(Optional.of(new AppSetting("siteTheme", "kaveri")));
        assertEquals("album", settings.getAll().get("siteTheme"));
    }

    @Test
    void unknownLooksAreRefused() {
        assertThrows(IllegalArgumentException.class, () -> settings.update(Map.of("siteTheme", "purple")));
        verify(repository, never()).save(any(AppSetting.class));
    }

    @Test
    void anEmptyChoiceGoesBackToTheDefault() {
        when(repository.findById(anyString())).thenReturn(Optional.empty());
        settings.update(Map.of("siteTheme", ""));
        verify(repository).deleteById("siteTheme");
    }
}
