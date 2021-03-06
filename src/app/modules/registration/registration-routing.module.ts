import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    {
        path: 'registration/edit/:id',
        loadChildren: './pages/overview/overview.module#OverviewPageModule'
    },
    {
        path: 'registration/set-time/:id',
        loadChildren: './pages/set-time/set-time.module#SetTimePageModule'
    },
    {
        path: 'registration/new/:geoHazard',
        loadChildren: './pages/obs-location/obs-location.module#ObsLocationPageModule'
    },
    {
        path: 'registration/obs-location/:id',
        loadChildren: './pages/obs-location/obs-location.module#ObsLocationPageModule'
    },
    {
        path: 'registration/group/:id',
        loadChildren: './pages/group/group.module#GroupPageModule'
    },
    {
        path: 'registration/general-comment/:id',
        loadChildren: './pages/general-comment/general-comment.module#GeneralCommentPageModule'
    },
    {
        path: 'registration/water/water-level/:id',
        loadChildren: './pages/water/water-level/water-level.module#WaterLevelPageModule'
    },
    {
        path: 'registration/water/damage/:id',
        loadChildren: './pages/water/damage/damage.module#DamagePageModule'
    },
    {
        path: 'registration/ice/ice-cover/:id',
        loadChildren: './pages/ice/ice-cover/ice-cover.module#IceCoverPageModule'
    },
    {
        path: 'registration/ice/ice-thickness/:id',
        loadChildren: './pages/ice/ice-thickness/ice-thickness.module#IceThicknessPageModule'
    },
    {
        path: 'registration/dirt/landslide-obs/:id',
        loadChildren: './pages/dirt/landslide-obs/landslide-obs.module#LandslideObsPageModule',
    },
    {
        path: 'registration/danger-obs/:id',
        loadChildren: './pages/danger-obs/danger-obs.module#DangerObsPageModule'
    },
    {
        path: 'registration/incident/:id',
        loadChildren: './pages/incident/incident.module#IncidentPageModule'
    },
    {
        path: 'registration/snow/avalanche-obs/:id',
        loadChildren: './pages/snow/avalanche-obs/avalanche-obs.module#AvalancheObsPageModule'
    },
    {
        path: 'registration/snow/avalanche-activity/:id',
        loadChildren: './pages/snow/avalanche-activity/avalanche-activity.module#AvalancheActivityPageModule'
    },
    {
        path: 'registration/snow/weather/:id',
        loadChildren: './pages/snow/weather/weather.module#WeatherPageModule'
    },
    {
        path: 'registration/snow/snow-surface/:id',
        loadChildren: './pages/snow/snow-surface/snow-surface.module#SnowSurfacePageModule'
    },
    {
        path: 'registration/snow/snow-profile/:id',
        loadChildren: './pages/snow/snow-profile/snow-profile.module#SnowProfilePageModule'
    },
    {
        path: 'registration/snow/compression-test/:id',
        loadChildren: './pages/snow/compression-test/compression-test.module#CompressionTestPageModule'
    },
    {
        path: 'registration/snow/avalanche-problem/:id',
        loadChildren: './pages/snow/avalanche-problem/avalanche-problem.module#AvalancheProblemPageModule'
    },
    {
        path: 'registration/snow/avalanche-evaluation/:id',
        loadChildren: './pages/snow/avalanche-evaluation/avalanche-evaluation.module#AvalancheEvaluationPageModule'
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RegistrationRoutingModule { }
