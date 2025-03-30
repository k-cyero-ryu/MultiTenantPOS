import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { changeLanguage, getCurrentLanguage } from '@/i18n';

const languageLabels = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português'
};

export function LanguageSelector() {
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={currentLang} onValueChange={(value) => changeLanguage(value)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder={t('settings.selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('settings.english')}</SelectItem>
          <SelectItem value="es">{t('settings.spanish')}</SelectItem>
          <SelectItem value="fr">{t('settings.french')}</SelectItem>
          <SelectItem value="pt">{t('settings.portuguese')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function LanguageSelectorFull() {
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t('settings.language')}</p>
      <Select value={currentLang} onValueChange={(value) => changeLanguage(value)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('settings.selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('settings.english')}</SelectItem>
          <SelectItem value="es">{t('settings.spanish')}</SelectItem>
          <SelectItem value="fr">{t('settings.french')}</SelectItem>
          <SelectItem value="pt">{t('settings.portuguese')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}